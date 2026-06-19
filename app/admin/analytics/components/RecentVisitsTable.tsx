import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Tablet } from "lucide-react";

interface Props {
  data: any[];
  loading: boolean;
}

export function RecentVisitsTable({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Visitors</CardTitle>
        <CardDescription>Latest unique visitors on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || !data ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 p-2">
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="hidden md:table-cell">Referrer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      No recent visitors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDistanceToNow(new Date(visit.visitedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
                            {visit.countryCode}
                          </span>
                          <span className="hidden sm:inline">{visit.countryName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {visit.device === "Mobile" ? (
                            <Smartphone className="h-3 w-3" />
                          ) : visit.device === "Tablet" ? (
                            <Tablet className="h-3 w-3" />
                          ) : (
                            <Monitor className="h-3 w-3" />
                          )}
                          {visit.device}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
                        {visit.referrer || "Direct"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
