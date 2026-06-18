import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { signToken } from "@/src/lib/auth";
import type { ApiResponse, User } from "@/src/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.otp !== otp) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP" },
        { status: 400 }
      );
    }

    if (!user.otpExpires || new Date() > user.otpExpires) {
      return NextResponse.json(
        { success: false, error: "OTP has expired. Please register again or request a new OTP." },
        { status: 400 }
      );
    }

    // Update user to verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        otp: null,
        otpExpires: null,
      },
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
