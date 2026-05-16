import { Search, ShoppingCart, Trophy } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Search,
    title: "Browse 50+ stocks",
    description: "Explore real NSE-listed stocks like Reliance, TCS, and HDFC Bank. Filter by sector, compare prices, and learn about each company.",
    action: "Pick one you like and start learning",
  },
  {
    number: 2,
    icon: ShoppingCart,
    title: "Buy with virtual money",
    description: "You get ₹1,00,000 in virtual cash when you sign up. Buy stocks at real market prices and build your dream portfolio.",
    action: "Watch your portfolio grow (or learn from losses)",
  },
  {
    number: 3,
    icon: Trophy,
    title: "Replay & compete",
    description: "Replay historic events like the COVID-19 crash or 2008 crisis. Join monthly tournaments and compete for the best returns.",
    action: "Win prize pools without risking real money",
  },
];

export function AppGuide() {
  return (
    <section className="w-full px-4 pb-20">
      <div className="mx-auto max-w-4xl">
        <div className="relative">
          <div className="absolute left-6 top-0 h-full w-0.5 bg-gradient-to-b from-amber-400/60 via-emerald-600/40 to-emerald-800/30 hidden sm:block" />

          <div className="space-y-10 sm:space-y-14">
            {steps.map((step) => (
              <div key={step.number} className="relative flex items-start gap-5 sm:gap-8">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-emerald-950 sm:h-14 sm:w-14">
                  <step.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-800 text-[10px] font-bold text-amber-400 ring-2 ring-emerald-950">
                    {step.number}
                  </span>
                </div>

                <div className="flex-1 pt-2 sm:pt-3">
                  <h3 className="text-lg font-bold text-foreground sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {step.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-amber-400/80">
                    💡 {step.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
