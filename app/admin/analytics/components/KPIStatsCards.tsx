import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Globe, TrendingUp, TrendingDown } from "lucide-react";

interface KPIProps {
  data: any;
  loading: boolean;
}

export function KPIStatsCards({ data, loading }: KPIProps) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const renderTrend = (change: number) => {
    if (change > 0) {
      return (
        <span className="flex items-center text-emerald-500 text-sm font-medium">
          <TrendingUp className="h-4 w-4 mr-1" />
          +{change}%
        </span>
      );
    }
    if (change < 0) {
      return (
        <span className="flex items-center text-rose-500 text-sm font-medium">
          <TrendingDown className="h-4 w-4 mr-1" />
          {change}%
        </span>
      );
    }
    return <span className="text-muted-foreground text-sm font-medium">0%</span>;
  };

  const cards = [
    {
      title: "Total Visits",
      value: data.totalVisitors.value,
      change: data.totalVisitors.change,
      icon: Users,
    },
    {
      title: "Unique Visitors",
      value: data.uniqueVisitors.value,
      change: data.uniqueVisitors.change,
      icon: UserCheck,
    },
    {
      title: "Countries Reached",
      value: data.countriesReached.value,
      change: data.countriesReached.change,
      icon: Globe,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, i) => (
        <Card key={i} className="overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {formatNumber(card.value)}
            </div>
            <div className="flex items-center mt-1 space-x-2">
              {renderTrend(card.change)}
              <span className="text-xs text-muted-foreground">vs previous period</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
