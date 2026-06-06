import { NextResponse } from "next/server";
import { fetchHistoricalPrices } from "@/src/lib/yahoo-finance";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "1d";

    const validRanges = ["1d", "5d", "1m", "1y"] as const;
    const r = validRanges.includes(range as any) ? (range as "1d" | "5d" | "1m" | "1y") : "1d";

    const { prices, isWeekend, chartDate } = await fetchHistoricalPrices(symbol, r);

    return NextResponse.json({ success: true, data: prices, isWeekend, chartDate });
  } catch (error) {
    console.error("Stock prices API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch price history" },
      { status: 500 }
    );
  }
}
