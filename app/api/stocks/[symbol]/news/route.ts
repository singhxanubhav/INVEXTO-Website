import { NextResponse } from "next/server";
import { getStockNews } from "@/src/lib/yahoo-finance";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const yfSymbol = symbol.includes(".") ? symbol : `${symbol}.NS`;
    const news = await getStockNews(yfSymbol);
    return NextResponse.json({ success: true, data: news });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
