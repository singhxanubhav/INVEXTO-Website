import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface StockDef {
  symbol: string;
  name: string;
  sector: string;
  faceValue: number;
}

const stocks: StockDef[] = [
  { symbol: "TCS.NS", name: "Tata Consultancy Services", sector: "IT", faceValue: 1 },
  { symbol: "INFY.NS", name: "Infosys", sector: "IT", faceValue: 5 },
  { symbol: "WIPRO.NS", name: "Wipro", sector: "IT", faceValue: 2 },
  { symbol: "HCLTECH.NS", name: "HCL Technologies", sector: "IT", faceValue: 2 },
  { symbol: "TECHM.NS", name: "Tech Mahindra", sector: "IT", faceValue: 5 },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", sector: "Banking", faceValue: 1 },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", sector: "Banking", faceValue: 2 },
  { symbol: "SBIN.NS", name: "State Bank of India", sector: "Banking", faceValue: 1 },
  { symbol: "KOTAKBANK.NS", name: "Kotak Mahindra Bank", sector: "Banking", faceValue: 5 },
  { symbol: "AXISBANK.NS", name: "Axis Bank", sector: "Banking", faceValue: 2 },
  { symbol: "HINDUNILVR.NS", name: "Hindustan Unilever", sector: "FMCG", faceValue: 1 },
  { symbol: "ITC.NS", name: "ITC Limited", sector: "FMCG", faceValue: 1 },
  { symbol: "NESTLEIND.NS", name: "Nestle India", sector: "FMCG", faceValue: 10 },
  { symbol: "DABUR.NS", name: "Dabur India", sector: "FMCG", faceValue: 1 },
  { symbol: "BRITANNIA.NS", name: "Britannia Industries", sector: "FMCG", faceValue: 1 },
  { symbol: "MARUTI.NS", name: "Maruti Suzuki India", sector: "Auto", faceValue: 5 },
  { symbol: "TATAMOTORS.NS", name: "Tata Motors", sector: "Auto", faceValue: 2 },
  { symbol: "BAJAJ-AUTO.NS", name: "Bajaj Auto", sector: "Auto", faceValue: 5 },
  { symbol: "HEROMOTOCO.NS", name: "Hero MotoCorp", sector: "Auto", faceValue: 2 },
  { symbol: "M&M.NS", name: "Mahindra & Mahindra", sector: "Auto", faceValue: 5 },
  { symbol: "SUNPHARMA.NS", name: "Sun Pharmaceutical", sector: "Pharma", faceValue: 1 },
  { symbol: "DRREDDY.NS", name: "Dr. Reddy's Laboratories", sector: "Pharma", faceValue: 5 },
  { symbol: "CIPLA.NS", name: "Cipla", sector: "Pharma", faceValue: 2 },
  { symbol: "DIVISLAB.NS", name: "Divi's Laboratories", sector: "Pharma", faceValue: 2 },
  { symbol: "BIOCON.NS", name: "Biocon", sector: "Pharma", faceValue: 5 },
  { symbol: "RELIANCE.NS", name: "Reliance Industries", sector: "Energy", faceValue: 10 },
  { symbol: "ONGC.NS", name: "Oil and Natural Gas Corporation", sector: "Energy", faceValue: 5 },
  { symbol: "NTPC.NS", name: "NTPC Limited", sector: "Energy", faceValue: 10 },
  { symbol: "POWERGRID.NS", name: "Power Grid Corporation", sector: "Energy", faceValue: 10 },
  { symbol: "BPCL.NS", name: "Bharat Petroleum", sector: "Energy", faceValue: 10 },
  { symbol: "BHARTIARTL.NS", name: "Bharti Airtel", sector: "Telecom", faceValue: 5 },
  { symbol: "IDEA.NS", name: "Vodafone Idea", sector: "Telecom", faceValue: 10 },
  { symbol: "LT.NS", name: "Larsen & Toubro", sector: "Infrastructure", faceValue: 2 },
  { symbol: "ADANIPORTS.NS", name: "Adani Ports and SEZ", sector: "Infrastructure", faceValue: 2 },
  { symbol: "ULTRACEMCO.NS", name: "UltraTech Cement", sector: "Infrastructure", faceValue: 10 },
  { symbol: "TATASTEEL.NS", name: "Tata Steel", sector: "Metals", faceValue: 1 },
  { symbol: "HINDALCO.NS", name: "Hindalco Industries", sector: "Metals", faceValue: 1 },
  { symbol: "JSWSTEEL.NS", name: "JSW Steel", sector: "Metals", faceValue: 1 },
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

const previousClosePrices: Record<string, number> = {
  "TCS.NS": 3920, "INFY.NS": 1495, "WIPRO.NS": 475, "HCLTECH.NS": 1430, "TECHM.NS": 1230,
  "HDFCBANK.NS": 1660, "ICICIBANK.NS": 1080, "SBIN.NS": 740, "KOTAKBANK.NS": 1780, "AXISBANK.NS": 1110,
  "HINDUNILVR.NS": 2580, "ITC.NS": 472, "NESTLEIND.NS": 24800, "DABUR.NS": 555, "BRITANNIA.NS": 5150,
  "MARUTI.NS": 10400, "TATAMOTORS.NS": 930, "BAJAJ-AUTO.NS": 7750, "HEROMOTOCO.NS": 4750, "M&M.NS": 1770,
  "SUNPHARMA.NS": 1530, "DRREDDY.NS": 6150, "CIPLA.NS": 1460, "DIVISLAB.NS": 3650, "BIOCON.NS": 285,
  "RELIANCE.NS": 2880, "ONGC.NS": 265, "NTPC.NS": 335, "POWERGRID.NS": 285, "BPCL.NS": 610,
  "BHARTIARTL.NS": 1240, "IDEA.NS": 14,
  "LT.NS": 3570, "ADANIPORTS.NS": 1280, "ULTRACEMCO.NS": 10400,
  "TATASTEEL.NS": 158, "HINDALCO.NS": 620, "JSWSTEEL.NS": 890,
  "ASIANPAINT.NS": 3080, "TITAN.NS": 3470, "BAJFINANCE.NS": 6950, "HDFCLIFE.NS": 640,
};

const sharesOutstanding: Record<string, number> = {
  "TCS.NS": 3_62_00_000, "INFY.NS": 4_15_00_000, "WIPRO.NS": 5_24_00_000, "HCLTECH.NS": 2_71_00_000, "TECHM.NS": 9_76_00_000,
  "HDFCBANK.NS": 7_58_00_000, "ICICIBANK.NS": 7_02_00_000, "SBIN.NS": 8_92_00_000, "KOTAKBANK.NS": 1_99_00_000, "AXISBANK.NS": 3_08_00_000,
  "HINDUNILVR.NS": 2_38_00_000, "ITC.NS": 12_47_00_000, "NESTLEIND.NS": 9_64_000, "DABUR.NS": 17_74_00_000, "BRITANNIA.NS": 2_41_00_000,
  "MARUTI.NS": 3_16_00_000, "TATAMOTORS.NS": 7_63_00_000, "BAJAJ-AUTO.NS": 3_06_00_000, "HEROMOTOCO.NS": 2_00_00_000, "M&M.NS": 12_56_00_000,
  "SUNPHARMA.NS": 23_99_00_000, "DRREDDY.NS": 16_68_00_000, "CIPLA.NS": 8_07_00_000, "DIVISLAB.NS": 2_66_00_000, "BIOCON.NS": 12_00_00_000,
  "RELIANCE.NS": 6_76_00_000, "ONGC.NS": 12_58_00_000, "NTPC.NS": 9_69_00_000, "POWERGRID.NS": 8_73_00_000, "BPCL.NS": 21_69_00_000,
  "BHARTIARTL.NS": 5_96_00_000, "IDEA.NS": 48_00_00_000,
  "LT.NS": 14_02_00_000, "ADANIPORTS.NS": 2_16_00_000, "ULTRACEMCO.NS": 2_89_00_000,
  "TATASTEEL.NS": 10_02_00_000, "HINDALCO.NS": 22_24_00_000, "JSWSTEEL.NS": 24_25_00_000,
  "ASIANPAINT.NS": 9_59_00_000, "TITAN.NS": 8_88_00_000, "BAJFINANCE.NS": 6_19_00_000, "HDFCLIFE.NS": 21_50_00_000,
};

const keyStatsData: Record<string, Record<string, number>> = {
  "TCS.NS": { ttmEps: 150, pbRatio: 12, sectorPe: 28, bookValue: 320, dividendYield: 1.2, beta: 0.8, avgVolume20d: 1800000, avgDeliveryPct20d: 55 },
  "INFY.NS": { ttmEps: 65, pbRatio: 8, sectorPe: 28, bookValue: 190, dividendYield: 1.8, beta: 0.9, avgVolume20d: 5200000, avgDeliveryPct20d: 48 },
  "WIPRO.NS": { ttmEps: 22, pbRatio: 5, sectorPe: 28, bookValue: 95, dividendYield: 2.1, beta: 1.1, avgVolume20d: 3800000, avgDeliveryPct20d: 42 },
  "HCLTECH.NS": { ttmEps: 62, pbRatio: 6, sectorPe: 28, bookValue: 240, dividendYield: 1.5, beta: 0.95, avgVolume20d: 2100000, avgDeliveryPct20d: 50 },
  "TECHM.NS": { ttmEps: 45, pbRatio: 4.5, sectorPe: 28, bookValue: 280, dividendYield: 2.5, beta: 1.2, avgVolume20d: 2500000, avgDeliveryPct20d: 40 },
  "HDFCBANK.NS": { ttmEps: 82, pbRatio: 3.2, sectorPe: 18, bookValue: 510, dividendYield: 0.8, beta: 0.85, avgVolume20d: 8500000, avgDeliveryPct20d: 60 },
  "ICICIBANK.NS": { ttmEps: 55, pbRatio: 2.8, sectorPe: 18, bookValue: 390, dividendYield: 0.9, beta: 0.9, avgVolume20d: 7200000, avgDeliveryPct20d: 55 },
  "SBIN.NS": { ttmEps: 38, pbRatio: 1.6, sectorPe: 18, bookValue: 470, dividendYield: 1.5, beta: 1.1, avgVolume20d: 12000000, avgDeliveryPct20d: 58 },
  "KOTAKBANK.NS": { ttmEps: 90, pbRatio: 3.5, sectorPe: 18, bookValue: 520, dividendYield: 0.7, beta: 0.8, avgVolume20d: 3200000, avgDeliveryPct20d: 52 },
  "AXISBANK.NS": { ttmEps: 48, pbRatio: 2.2, sectorPe: 18, bookValue: 490, dividendYield: 1.0, beta: 1.0, avgVolume20d: 5800000, avgDeliveryPct20d: 50 },
  "HINDUNILVR.NS": { ttmEps: 42, pbRatio: 10, sectorPe: 35, bookValue: 260, dividendYield: 1.6, beta: 0.7, avgVolume20d: 2800000, avgDeliveryPct20d: 62 },
  "ITC.NS": { ttmEps: 18, pbRatio: 5.5, sectorPe: 35, bookValue: 88, dividendYield: 2.8, beta: 0.75, avgVolume20d: 9500000, avgDeliveryPct20d: 58 },
  "NESTLEIND.NS": { ttmEps: 330, pbRatio: 28, sectorPe: 35, bookValue: 890, dividendYield: 0.6, beta: 0.6, avgVolume20d: 450000, avgDeliveryPct20d: 65 },
  "DABUR.NS": { ttmEps: 12, pbRatio: 7.5, sectorPe: 35, bookValue: 74, dividendYield: 1.9, beta: 0.8, avgVolume20d: 2200000, avgDeliveryPct20d: 48 },
  "BRITANNIA.NS": { ttmEps: 85, pbRatio: 14, sectorPe: 35, bookValue: 370, dividendYield: 1.2, beta: 0.7, avgVolume20d: 800000, avgDeliveryPct20d: 55 },
  "MARUTI.NS": { ttmEps: 420, pbRatio: 3.8, sectorPe: 22, bookValue: 2800, dividendYield: 0.5, beta: 0.9, avgVolume20d: 1200000, avgDeliveryPct20d: 52 },
  "TATAMOTORS.NS": { ttmEps: 35, pbRatio: 2.5, sectorPe: 22, bookValue: 380, dividendYield: 0.8, beta: 1.3, avgVolume20d: 8500000, avgDeliveryPct20d: 48 },
  "BAJAJ-AUTO.NS": { ttmEps: 310, pbRatio: 4.2, sectorPe: 22, bookValue: 1850, dividendYield: 1.0, beta: 0.85, avgVolume20d: 600000, avgDeliveryPct20d: 55 },
  "HEROMOTOCO.NS": { ttmEps: 210, pbRatio: 3.5, sectorPe: 22, bookValue: 1370, dividendYield: 1.5, beta: 0.8, avgVolume20d: 900000, avgDeliveryPct20d: 50 },
  "M&M.NS": { ttmEps: 72, pbRatio: 2.8, sectorPe: 22, bookValue: 640, dividendYield: 1.2, beta: 1.0, avgVolume20d: 3500000, avgDeliveryPct20d: 52 },
  "SUNPHARMA.NS": { ttmEps: 38, pbRatio: 5.5, sectorPe: 30, bookValue: 280, dividendYield: 0.9, beta: 0.85, avgVolume20d: 4200000, avgDeliveryPct20d: 55 },
  "DRREDDY.NS": { ttmEps: 220, pbRatio: 6.2, sectorPe: 30, bookValue: 1000, dividendYield: 0.7, beta: 0.8, avgVolume20d: 800000, avgDeliveryPct20d: 58 },
  "CIPLA.NS": { ttmEps: 28, pbRatio: 4.8, sectorPe: 30, bookValue: 310, dividendYield: 1.1, beta: 0.9, avgVolume20d: 3200000, avgDeliveryPct20d: 48 },
  "DIVISLAB.NS": { ttmEps: 95, pbRatio: 8.5, sectorPe: 30, bookValue: 435, dividendYield: 0.5, beta: 0.75, avgVolume20d: 1200000, avgDeliveryPct20d: 52 },
  "BIOCON.NS": { ttmEps: 8, pbRatio: 3.2, sectorPe: 30, bookValue: 90, dividendYield: 0.3, beta: 1.1, avgVolume20d: 4800000, avgDeliveryPct20d: 40 },
  "RELIANCE.NS": { ttmEps: 105, pbRatio: 2.8, sectorPe: 15, bookValue: 1040, dividendYield: 0.4, beta: 1.0, avgVolume20d: 7800000, avgDeliveryPct20d: 58 },
  "ONGC.NS": { ttmEps: 28, pbRatio: 1.2, sectorPe: 12, bookValue: 225, dividendYield: 4.2, beta: 1.2, avgVolume20d: 6500000, avgDeliveryPct20d: 50 },
  "NTPC.NS": { ttmEps: 18, pbRatio: 1.5, sectorPe: 12, bookValue: 230, dividendYield: 3.0, beta: 0.9, avgVolume20d: 7200000, avgDeliveryPct20d: 55 },
  "POWERGRID.NS": { ttmEps: 15, pbRatio: 1.8, sectorPe: 12, bookValue: 160, dividendYield: 3.5, beta: 0.85, avgVolume20d: 4800000, avgDeliveryPct20d: 52 },
  "BPCL.NS": { ttmEps: 32, pbRatio: 1.4, sectorPe: 12, bookValue: 440, dividendYield: 3.8, beta: 1.3, avgVolume20d: 3600000, avgDeliveryPct20d: 45 },
  "BHARTIARTL.NS": { ttmEps: 25, pbRatio: 4.5, sectorPe: 20, bookValue: 280, dividendYield: 0.6, beta: 1.1, avgVolume20d: 5200000, avgDeliveryPct20d: 55 },
  "IDEA.NS": { ttmEps: -2, pbRatio: 1.2, sectorPe: 20, bookValue: 12, dividendYield: 0, beta: 1.5, avgVolume20d: 18000000, avgDeliveryPct20d: 35 },
  "LT.NS": { ttmEps: 95, pbRatio: 3.5, sectorPe: 25, bookValue: 1030, dividendYield: 1.0, beta: 1.05, avgVolume20d: 2800000, avgDeliveryPct20d: 55 },
  "ADANIPORTS.NS": { ttmEps: 32, pbRatio: 4.2, sectorPe: 25, bookValue: 310, dividendYield: 0.5, beta: 1.4, avgVolume20d: 3800000, avgDeliveryPct20d: 50 },
  "ULTRACEMCO.NS": { ttmEps: 280, pbRatio: 5.5, sectorPe: 25, bookValue: 1900, dividendYield: 0.6, beta: 0.8, avgVolume20d: 600000, avgDeliveryPct20d: 58 },
  "TATASTEEL.NS": { ttmEps: 12, pbRatio: 1.5, sectorPe: 10, bookValue: 110, dividendYield: 2.5, beta: 1.4, avgVolume20d: 8500000, avgDeliveryPct20d: 48 },
  "HINDALCO.NS": { ttmEps: 28, pbRatio: 1.8, sectorPe: 10, bookValue: 350, dividendYield: 1.2, beta: 1.3, avgVolume20d: 5200000, avgDeliveryPct20d: 45 },
  "JSWSTEEL.NS": { ttmEps: 35, pbRatio: 2.0, sectorPe: 10, bookValue: 450, dividendYield: 1.0, beta: 1.2, avgVolume20d: 3200000, avgDeliveryPct20d: 50 },
  "ASIANPAINT.NS": { ttmEps: 52, pbRatio: 12, sectorPe: 35, bookValue: 260, dividendYield: 0.7, beta: 0.75, avgVolume20d: 1800000, avgDeliveryPct20d: 60 },
  "TITAN.NS": { ttmEps: 58, pbRatio: 15, sectorPe: 35, bookValue: 230, dividendYield: 0.4, beta: 0.8, avgVolume20d: 1500000, avgDeliveryPct20d: 55 },
  "BAJFINANCE.NS": { ttmEps: 180, pbRatio: 5.8, sectorPe: 25, bookValue: 1200, dividendYield: 0.3, beta: 1.0, avgVolume20d: 2800000, avgDeliveryPct20d: 52 },
  "HDFCLIFE.NS": { ttmEps: 15, pbRatio: 4.2, sectorPe: 22, bookValue: 155, dividendYield: 0.5, beta: 0.9, avgVolume20d: 4200000, avgDeliveryPct20d: 50 },
};

function generatePriceArray(
  finalMultiplier: number,
  days: number,
  volatility: number
): number[] {
  const arr: number[] = [];
  for (let i = 0; i < days; i++) {
    const progress = days > 1 ? i / (days - 1) : 1;
    const target = 1 + (finalMultiplier - 1) * progress;
    const noise = (Math.random() - 0.5) * volatility;
    arr.push(Number((target + noise).toFixed(4)));
  }
  if (arr.length > 0) {
    arr[arr.length - 1] = Number(finalMultiplier.toFixed(4));
  }
  return arr;
}

function generateCrashArrays(
  minDrop: number,
  maxDrop: number,
  days: number
): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  for (const s of stocks) {
    let resilience = 1.0;
    if (s.sector === "IT") resilience = 0.85;
    else if (s.sector === "FMCG") resilience = 0.80;
    else if (s.sector === "Pharma") resilience = 0.85;
    else if (s.sector === "Telecom") resilience = 0.90;
    const drop = (minDrop + Math.random() * (maxDrop - minDrop)) * resilience;
    const finalMultiplier = 1 - drop;
    result[s.symbol] = generatePriceArray(finalMultiplier, days, 0.015);
  }
  return result;
}

function generateRallyArrays(
  minGain: number,
  maxGain: number,
  days: number
): Record<string, number[]> {
  const result: Record<string, number[]> = {};
  for (const s of stocks) {
    let bonus = 0;
    if (s.sector === "IT") bonus = 0.05;
    else if (s.sector === "Pharma") bonus = 0.05;
    else if (s.sector === "Consumer") bonus = 0.03;
    const gain = minGain + Math.random() * (maxGain - minGain) + bonus;
    const finalMultiplier = 1 + gain;
    result[s.symbol] = generatePriceArray(finalMultiplier, days, 0.018);
  }
  return result;
}

const eventConfigs = [
  {
    name: "COVID-19 Crash",
    description: "Global pandemic triggers sharp market sell-off. Feb–Apr 2020. Most stocks fell 20-50%. IT and FMCG showed relative resilience.",
    startRealDate: new Date("2020-02-20"),
    endRealDate: new Date("2020-04-30"),
    durationDays: 70,
    gen: (d: number) => generateCrashArrays(0.35, 0.45, d),
  },
  {
    name: "COVID Recovery Rally",
    description: "Markets rebound sharply after pandemic lows driven by liquidity and vaccine optimism. May–Dec 2020.",
    startRealDate: new Date("2020-05-01"),
    endRealDate: new Date("2020-12-31"),
    durationDays: 245,
    gen: (d: number) => generateRallyArrays(0.25, 0.40, d),
  },
  {
    name: "2008 Global Financial Crisis",
    description: "Subprime mortgage crisis triggers worldwide recession. Most Indian stocks fell 40-60%.",
    startRealDate: new Date("2008-09-15"),
    endRealDate: new Date("2008-11-30"),
    durationDays: 76,
    gen: (d: number) => generateCrashArrays(0.45, 0.55, d),
  },
  {
    name: "2016 Demonetisation",
    description: "India's sudden currency ban causes short-term market disruption. Nov–Dec 2016.",
    startRealDate: new Date("2016-11-08"),
    endRealDate: new Date("2016-12-31"),
    durationDays: 53,
    gen: (d: number) => generateCrashArrays(0.10, 0.25, d),
  },
  {
    name: "2020-2021 Bull Market",
    description: "Historic bull run driven by retail participation, low interest rates, and economic reopening. Jan–Oct 2021.",
    startRealDate: new Date("2021-01-01"),
    endRealDate: new Date("2021-10-31"),
    durationDays: 304,
    gen: (d: number) => generateRallyArrays(0.25, 0.45, d),
  },
  {
    name: "2022 Global Inflation Selloff",
    description: "Rising interest rates and inflation fears cause broad market correction. IT stocks hit hardest. Jan–Jun 2022.",
    startRealDate: new Date("2022-01-01"),
    endRealDate: new Date("2022-06-30"),
    durationDays: 181,
    gen: (d: number) => generateCrashArrays(0.20, 0.35, d),
  },
  {
    name: "2023 Nifty 50 ATH Rally",
    description: "Markets hit all-time highs driven by strong domestic flows and political stability. Nov–Dec 2023.",
    startRealDate: new Date("2023-11-01"),
    endRealDate: new Date("2023-12-31"),
    durationDays: 61,
    gen: (d: number) => generateRallyArrays(0.10, 0.20, d),
  },
];

async function main() {
  console.log("Seeding database...");

  // Clear existing data in correct order (respect foreign keys)
  await prisma.tournamentRegistration.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.stockPrice.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.simulationEvent.deleteMany();

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  for (const stock of stocks) {
    const price = currentPrices[stock.symbol];
    const prevClose = previousClosePrices[stock.symbol];
    const outstanding = sharesOutstanding[stock.symbol];

    const ks = keyStatsData[stock.symbol] || { ttmEps: 10, pbRatio: 2, sectorPe: 20, bookValue: 100, dividendYield: 1, beta: 1, avgVolume20d: 1000000, avgDeliveryPct20d: 50 };

    await prisma.stock.create({
      data: {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        faceValue: stock.faceValue,
        sharesOutstanding: BigInt(outstanding),
        keyStats: ks,
        stockPrices: {
          createMany: {
            data: [
              {
                price: prevClose,
                volume: BigInt(Math.floor(500000 + Math.random() * 5000000)),
                timestamp: yesterday,
                priceType: "historical",
              },
              {
                price: price,
                volume: BigInt(Math.floor(500000 + Math.random() * 5000000)),
                timestamp: now,
                priceType: "simulated",
              },
            ],
          },
        },
      },
    });
    const change = ((price - prevClose) / prevClose * 100).toFixed(2);
    console.log(`  Created stock: ${stock.symbol} @ ₹${price} (prev: ₹${prevClose}, ${change}%)`);
  }

  for (const cfg of eventConfigs) {
    const { gen, ...eventData } = cfg;
    await prisma.simulationEvent.create({
      data: {
        ...eventData,
        priceMultipliers: gen(eventData.durationDays),
      },
    });
    console.log(`  Created simulation event: ${cfg.name}`);
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
