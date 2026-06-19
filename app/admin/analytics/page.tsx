import { Metadata } from "next";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Analytics | Admin Dashboard",
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnalyticsDashboard />
    </div>
  );
}
