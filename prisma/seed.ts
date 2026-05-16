import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stocks = [
  // IT
  { symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "IT", faceValue: 1 },
  { symbol: "INFY.NS", name: "Infosys", sector: "IT", faceValue: 5 },
  { symbol: "WIPRO.NS", name: "Wipro", sector: "IT", faceValue: 2 },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", sector: "IT", faceValue: 2 },
  { symbol: "TECHM.NS", name: "Tech Mahindra", sector: "IT", faceValue: 5 },
  // Banking
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", sector: "Banking", faceValue: 1 },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", sector: "Banking", faceValue: 2 },
  { symbol: "SBIN.NS", name: "State Bank of India", sector: "Banking", faceValue: 1 },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Banking", faceValue: 5 },
  { symbol: "AXISBANK.NS", name: "Axis Bank", sector: "Banking", faceValue: 2 },
  // FMCG
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "FMCG", faceValue: 1 },
  { symbol: "ITC.NS", name: "ITC Limited", sector: "FMCG", faceValue: 1 },
  { symbol: "NESTLEIND.NS", name: "Nestle India", sector: "FMCG", faceValue: 10 },
  { symbol: "DABUR.NS", name: "Dabur India", sector: "FMCG", faceValue: 1 },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries", sector: "FMCG", faceValue: 1 },
  // Auto
  { symbol: "MARUTI.NS", name: "Maruti Suzuki India", sector: "Auto", faceValue: 5 },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", sector: "Auto", faceValue: 2 },
  { symbol: "BAJAJ-AUTO.NS", name: "Bajaj Auto", sector: "Auto", faceValue: 5 },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp", sector: "Auto", faceValue: 2 },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", sector: "Auto", faceValue: 5 },
  // Pharma
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", sector: "Pharma", faceValue: 1 },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories", sector: "Pharma", faceValue: 5 },
  { symbol: "CIPLA.NS", name: "Cipla", sector: "Pharma", faceValue: 2 },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories", sector: "Pharma", faceValue: 2 },
  { symbol: "BIOCON.NS", name: "Biocon", sector: "Pharma", faceValue: 5 },
  // Energy
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy", faceValue: 10 },
  { symbol: "ONGC.NS", name: "Oil and Natural Gas Corporation", sector: "Energy", faceValue: 5 },
  { symbol: "NTPC.NS", name: "NTPC Limited", sector: "Energy", faceValue: 10 },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation", sector: "Energy", faceValue: 10 },
  { symbol: "BPCL.NS", name: "Bharat Petroleum", sector: "Energy", faceValue: 10 },
  // Telecom
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Telecom", faceValue: 5 },
  { symbol: "IDEA.NS", name: "Vodafone Idea", sector: "Telecom", faceValue: 10 },
  // Infra
  { symbol: "LT.NS", name: "Larsen & Toubro", sector: "Infrastructure", faceValue: 2 },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports and SEZ", sector: "Infrastructure", faceValue: 2 },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", sector: "Infrastructure", faceValue: 10 },
  // Metals
  { symbol: "TATASTEEL.NS", name: "Tata Steel", sector: "Metals", faceValue: 1 },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries", sector: "Metals", faceValue: 1 },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", sector: "Metals", faceValue: 1 },
  // Consumer
  { symbol: "ASIANPAINT.NS", name: "Asian Paints", sector: "Consumer", faceValue: 1 },
  { symbol: "TITAN.NS", name: "Titan Company", sector: "Consumer", faceValue: 1 },
  { symbol: "BAJFINANCE.NS", name: "Bajaj Finance", sector: "Consumer", faceValue: 2 },
  { symbol: "HDFCLIFE.NS", name: "HDFC Life Insurance", sector: "Consumer", faceValue: 10 },
];

const currentPrices: Record<string, number> = {
  "TCS.NS": 3950, "INFY.NS": 1520, "WIPRO.NS": 480, "HCLTECH.NS": 1450, "TECHM.NS": 1250,
  "HDFCBANK.NS": 1650, "ICICIBANK.NS": 1100, "SBIN.NS": 750, "KOTAKBANK.NS": 1800, "AXISBANK.NS": 1100,
  "HINDUNILVR.NS": 2600, "ITC.NS": 480, "NESTLEIND.NS": 25000, "DABUR.NS": 560, "BRITANNIA.NS": 5200,
  "MARUTI.NS": 10500, "TATAMOTORS.NS": 950, "BAJAJ-AUTO.NS": 7800, "HEROMOTOCO.NS": 4800, "M&M.NS": 1800,
  "SUNPHARMA.NS": 1550, "DRREDDY.NS": 6200, "CIPLA.NS": 1480, "DIVISLAB.NS": 3700, "BIOCON.NS": 290,
  "RELIANCE.NS": 2900, "ONGC.NS": 270, "NTPC.NS": 340, "POWERGRID.NS": 290, "BPCL.NS": 620,
  "BHARTIARTL.NS": 1250, "IDEA.NS": 15,
  "LT.NS": 3600, "ADANIPORTS.NS": 1300, "ULTRACEMCO.NS": 10500,
  "TATASTEEL.NS": 160, "HINDALCO.NS": 630, "JSWSTEEL.NS": 900,
  "ASIANPAINT.NS": 3100, "TITAN.NS": 3500, "BAJFINANCE.NS": 7000, "HDFCLIFE.NS": 650,
};

const simulationEvents = [
  {
    name: "COVID-19 Crash",
    description: "Global pandemic triggers sharp market sell-off. Feb–Apr 2020. Most stocks fell 20-50%. IT and FMCG showed relative resilience.",
    startRealDate: new Date("2020-02-20"),
    endRealDate: new Date("2020-04-30"),
    durationDays: 70,
    priceMultipliers: generateCrashMultipliers(0.35, 0.45),
  },
  {
    name: "COVID Recovery Rally",
    description: "Markets rebound sharply after pandemic lows driven by liquidity and vaccine optimism. May–Dec 2020.",
    startRealDate: new Date("2020-05-01"),
    endRealDate: new Date("2020-12-31"),
    durationDays: 245,
    priceMultipliers: generateRallyMultipliers(0.25, 0.40),
  },
  {
    name: "2008 Global Financial Crisis",
    description: "Subprime mortgage crisis triggers worldwide recession. Most Indian stocks fell 40-60%.",
    startRealDate: new Date("2008-09-15"),
    endRealDate: new Date("2008-11-30"),
    durationDays: 76,
    priceMultipliers: generateCrashMultipliers(0.45, 0.55),
  },
  {
    name: "2016 Demonetisation",
    description: "India's sudden currency ban causes short-term market disruption. Nov–Dec 2016.",
    startRealDate: new Date("2016-11-08"),
    endRealDate: new Date("2016-12-31"),
    durationDays: 53,
    priceMultipliers: generateCrashMultipliers(0.10, 0.25),
  },
  {
    name: "2020-2021 Bull Market",
    description: "Historic bull run driven by retail participation, low interest rates, and economic reopening. Jan–Oct 2021.",
    startRealDate: new Date("2021-01-01"),
    endRealDate: new Date("2021-10-31"),
    durationDays: 304,
    priceMultipliers: generateRallyMultipliers(0.25, 0.45),
  },
  {
    name: "2022 Global Inflation Selloff",
    description: "Rising interest rates and inflation fears cause broad market correction. IT stocks hit hardest. Jan–Jun 2022.",
    startRealDate: new Date("2022-01-01"),
    endRealDate: new Date("2022-06-30"),
    durationDays: 181,
    priceMultipliers: generateCrashMultipliers(0.20, 0.35),
  },
  {
    name: "2023 Nifty 50 ATH Rally",
    description: "Markets hit all-time highs driven by strong domestic flows and political stability. Nov–Dec 2023.",
    startRealDate: new Date("2023-11-01"),
    endRealDate: new Date("2023-12-31"),
    durationDays: 61,
    priceMultipliers: generateRallyMultipliers(0.10, 0.20),
  },
];

function generateCrashMultipliers(minDrop: number, maxDrop: number): Record<string, number> {
  const result: Record<string, number> = {};
  for (const s of stocks) {
    const sector = s.sector;
    let resilience = 1.0;
    if (sector === "IT") resilience = 0.85;
    else if (sector === "FMCG") resilience = 0.80;
    else if (sector === "Pharma") resilience = 0.85;
    else if (sector === "Telecom") resilience = 0.90;
    const drop = (minDrop + Math.random() * (maxDrop - minDrop)) * resilience;
    result[s.symbol] = 1 - drop;
  }
  return result;
}

function generateRallyMultipliers(minGain: number, maxGain: number): Record<string, number> {
  const result: Record<string, number> = {};
  for (const s of stocks) {
    const sector = s.sector;
    let bonus = 0.0;
    if (sector === "IT") bonus = 0.05;
    else if (sector === "Pharma") bonus = 0.05;
    else if (sector === "Consumer") bonus = 0.03;
    const gain = minGain + Math.random() * (maxGain - minGain) + bonus;
    result[s.symbol] = 1 + gain;
  }
  return result;
}

async function main() {
  console.log("Seeding database...");

  for (const stock of stocks) {
    const price = currentPrices[stock.symbol];
    await prisma.stock.create({
      data: {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        faceValue: stock.faceValue,
        stockPrices: {
          create: {
            price: price,
            volume: BigInt(Math.floor(500000 + Math.random() * 5000000)),
            timestamp: new Date(),
            priceType: "live",
          },
        },
      },
    });
    console.log(`  Created stock: ${stock.symbol} @ ₹${price}`);
  }

  for (const event of simulationEvents) {
    await prisma.simulationEvent.create({
      data: event,
    });
    console.log(`  Created simulation event: ${event.name}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
