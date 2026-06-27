import { TrendingUp, BarChart3, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: TrendingUp,
    title: "50+ Indian Stocks",
    description:
      "Trade real NSE-listed stocks like Reliance, TCS, and HDFC Bank with virtual money",
  },
  {
    icon: BarChart3,
    title: "Replay Historic Events",
    description:
      "Experience market crashes and rallies from COVID-19 to the 2008 financial crisis",
  },
  {
    icon: Trophy,
    title: "Monthly Tournaments",
    description:
      "Compete with friends and win prize pools. No real money needed",
  },
];

export function FeatureCards() {
  return (
    <section className="w-full px-4 pb-20">
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="border-emerald-800/30 bg-emerald-900/20"
          >
            <CardHeader>
              <feature.icon className="h-8 w-8 text-amber-400" />
              <CardTitle className="text-foreground">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
