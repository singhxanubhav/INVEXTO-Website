"use client";

import { useState, useEffect } from "react";
import { KPIStatsCards } from "./KPIStatsCards";
import { VisitorCharts } from "./VisitorCharts";
import { CountryCharts } from "./CountryCharts";
import { RecentVisitsTable } from "./RecentVisitsTable";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";

export function AnalyticsDashboard() {
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    overview: any;
    visitors: any[];
    countries: any[];
    recent: any[];
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, visitorsRes, countriesRes, recentRes] = await Promise.all([
        fetch(`/api/admin/analytics/overview?range=${range}`),
        fetch(`/api/admin/analytics/visitors?range=${range}`),
        fetch(`/api/admin/analytics/countries?range=${range}`),
        fetch(`/api/admin/analytics/recent`)
      ]);

      if (!overviewRes.ok) throw new Error("Failed to load overview");

      setData({
        overview: await overviewRes.json(),
        visitors: await visitorsRes.json(),
        countries: await countriesRes.json(),
        recent: await recentRes.json(),
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to load analytics data. Are you an admin?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Auto refresh every 60s
    return () => clearInterval(interval);
  }, [range]);

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      <div className="mb-2">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 -mt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
          <p className="text-muted-foreground mt-1">Monitor your website traffic and user engagement.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Tabs value={range} onValueChange={(v: any) => setRange(v)}>
            <TabsList className="bg-muted/50 border">
              <TabsTrigger value="7">7 Days</TabsTrigger>
              <TabsTrigger value="30">30 Days</TabsTrigger>
              <TabsTrigger value="90">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading} className={loading ? "animate-spin" : ""}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <KPIStatsCards data={data?.overview} loading={loading} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VisitorCharts data={data?.visitors || []} loading={loading} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CountryCharts data={data?.countries || []} loading={loading} />
      </div>

      <RecentVisitsTable data={data?.recent || []} loading={loading} />
    </div>
  );
}
