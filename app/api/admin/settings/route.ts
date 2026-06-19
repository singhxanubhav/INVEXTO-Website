import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession(req);
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce<Record<string, string>>((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    
    // Set default if not exists
    if (!settingsMap["requireOtpRegistration"]) {
      settingsMap["requireOtpRegistration"] = "true";
    }

    return NextResponse.json({ success: true, data: settingsMap });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireSession(req);
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { key, value } = await req.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });

    return NextResponse.json({ success: true, message: "Setting updated" });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Settings PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
