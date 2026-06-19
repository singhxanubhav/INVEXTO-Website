import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireSession } from "@/src/lib/session";

const SUPER_ADMIN_EMAIL = "anubhavsinghbkj@gmail.com";

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireSession(req);
    
    if (user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    const { userId, isAdmin } = await req.json();

    if (!userId || typeof isAdmin !== "boolean") {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Protect super admin from accidentally demoting themselves
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (targetUser?.email === SUPER_ADMIN_EMAIL && !isAdmin) {
      return NextResponse.json({ error: "Cannot demote the super admin" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin }
    });

    return NextResponse.json({ success: true, message: `User role updated successfully` });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("Role update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
