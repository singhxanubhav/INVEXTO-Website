export interface GlossaryTerm {
  term: string;
  definition: string;
  howToUse: string;
  emoji: string;
  category: "Fundamentals" | "Trading" | "Market Events";
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: "Bullish",
    definition: "When the market or a stock is going up in price. A bull market means prices are rising steadily over time.",
    howToUse: "If a stock is bullish, the price is rising — good time to buy or hold.",
    emoji: "🐂",
    category: "Trading",
  },
  {
    term: "Bearish",
    definition: "When the market or a stock is going down in price. A bear market means prices are falling.",
    howToUse: "In a bearish market, prices fall — consider selling or waiting.",
    emoji: "🐻",
    category: "Trading",
  },
  {
    term: "Portfolio",
    definition: "Your personal collection of stocks and investments. It shows everything you own and how much it's worth.",
    howToUse: "Check your portfolio to see your total invested value and daily gains or losses.",
    emoji: "📂",
    category: "Fundamentals",
  },
  {
    term: "Market Cap",
    definition: "Total value of a company calculated as current price × total shares. Companies are classified as Large-cap (>₹20,000 Cr), Mid-cap, or Small-cap.",
    howToUse: "Large-cap stocks (like Reliance) are more stable than small-caps.",
    emoji: "🏢",
    category: "Fundamentals",
  },
  {
    term: "TTM EPS",
    definition: "Earnings Per Share over the last 12 months (Trailing Twelve Months). Shows how much profit a company made per share.",
    howToUse: "Higher EPS = company is profitable. Compare across similar stocks.",
    emoji: "💰",
    category: "Fundamentals",
  },
  {
    term: "P/E Ratio",
    definition: "Price-to-Earnings ratio tells you how much you're paying for each rupee of profit the company makes.",
    howToUse: "A P/E of 20 means you pay ₹20 for every ₹1 of profit. Lower P/E can mean undervalued.",
    emoji: "📊",
    category: "Fundamentals",
  },
  {
    term: "P/B Ratio",
    definition: "Price-to-Book ratio compares the market price to the company's actual asset value (book value).",
    howToUse: "P/B below 1 may mean the stock is undervalued. Above 3 is common for growth companies.",
    emoji: "⚖️",
    category: "Fundamentals",
  },
  {
    term: "Beta",
    definition: "A measure of how much a stock's price moves compared to the overall market. Beta of 1 = moves with the market.",
    howToUse: "Beta > 1 means riskier but potentially higher returns. Beta < 1 means more stable.",
    emoji: "📈",
    category: "Trading",
  },
  {
    term: "Dividend Yield",
    definition: "The annual dividend payment divided by the stock price, shown as a percentage. Income you earn just by holding the stock.",
    howToUse: "A 3% yield means ₹3 dividend per ₹100 invested. Good for long-term passive income.",
    emoji: "💵",
    category: "Fundamentals",
  },
  {
    term: "Circuit Breaker",
    definition: "A price limit set by the exchange for the day. Upper circuit = max price up, Lower circuit = max price down (usually 20%).",
    howToUse: "Upper circuit = stock can't go higher today. Lower = can't go lower. Common in volatile stocks.",
    emoji: "⛔",
    category: "Market Events",
  },
  {
    term: "Face Value",
    definition: "The original nominal value of a share printed on the certificate. Set when the company issues shares.",
    howToUse: "Face value is fixed; market price changes daily. Don't confuse face value with actual stock price.",
    emoji: "📜",
    category: "Fundamentals",
  },
  {
    term: "Book Value",
    definition: "Net assets of a company divided by total shares. Represents what each share is worth if the company sold everything.",
    howToUse: "Compare to market price using P/B ratio. If market price < book value, stock may be undervalued.",
    emoji: "📕",
    category: "Fundamentals",
  },
  {
    term: "VWAP",
    definition: "Volume Weighted Average Price — the average price a stock has traded at throughout the day, weighted by volume.",
    howToUse: "Buying below VWAP is generally a good entry point. Institutions use VWAP to execute large orders.",
    emoji: "📉",
    category: "Trading",
  },
  {
    term: "Realised Gain",
    definition: "The actual profit you make after selling a stock. The gain is 'realised' only when you sell, not before.",
    howToUse: "Only counted after you actually sell the stock. Track this to know your true profit.",
    emoji: "✅",
    category: "Trading",
  },
  {
    term: "Unrealised Gain",
    definition: "Paper profit on stocks you still hold. The value has gone up but you haven't sold yet.",
    howToUse: "Your portfolio value increase while still holding. Can disappear if price drops — not guaranteed until you sell.",
    emoji: "📋",
    category: "Trading",
  },
  {
    term: "20D Avg Volume",
    definition: "Average number of shares traded daily over the last 20 trading sessions. Shows how liquid a stock is.",
    howToUse: "Low volume = less liquid, harder to buy/sell quickly without affecting price.",
    emoji: "🔊",
    category: "Trading",
  },
];
