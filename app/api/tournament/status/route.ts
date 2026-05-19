import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const tournament = await prisma.tournament.findFirst({
      where: { status: "active" },
    });

    return NextResponse.json({
      success: true,
      data: { isActive: !!tournament },
    });
  } catch {
    return NextResponse.json({ success: true, data: { isActive: false } });
  }
}
