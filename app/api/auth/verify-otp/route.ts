import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { signToken } from "@/src/lib/auth";
import type { ApiResponse, User } from "@/src/types";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pendingToken, otp } = body;

    if (!pendingToken || !otp) {
      return NextResponse.json(
        { success: false, error: "Pending token and OTP are required" },
        { status: 400 }
      );
    }

    const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
    let payload: any;
    try {
      payload = jwt.verify(pendingToken, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { success: false, error: "Session expired. Please register again." },
        { status: 400 }
      );
    }

    if (payload.otp !== otp) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (new Date() > new Date(payload.otpExpires)) {
      return NextResponse.json(
        { success: false, error: "OTP has expired. Please register again." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 400 });
    }

    const shouldBeAdmin = payload.email === "kshitijvaishnav4@gmail.com" || payload.email === "anubhavsinghbkj@gmail.com";

    const updatedUser = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash: payload.passwordHash,
        upiId: payload.upiId,
        emailVerified: true,
        isAdmin: shouldBeAdmin,
      },
    });

    await prisma.portfolio.create({
      data: { userId: updatedUser.id, cashBalance: 100000 },
    });

    // Automatically log them in by generating a token
    const token = signToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      isAdmin: updatedUser.isAdmin,
    });

    const userData: User = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      upiId: updatedUser.upiId,
      isAdmin: updatedUser.isAdmin,
      createdAt: updatedUser.createdAt.toISOString(),
    };

    const response = NextResponse.json(
      { success: true, data: userData } satisfies ApiResponse<User>,
      { status: 200 }
    );

    response.cookies.set("invexto_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OTP Verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
