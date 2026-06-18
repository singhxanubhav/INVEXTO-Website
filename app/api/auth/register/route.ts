import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { signToken, hashPassword } from "@/src/lib/auth";
import type { ApiResponse, User } from "@/src/types";

import crypto from "crypto";
import { sendOtpEmail } from "@/src/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, upiId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    
    // Generate a 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const dbUser = await prisma.user.create({
      data: { 
        name, 
        email, 
        passwordHash, 
        upiId: upiId || null,
        otp,
        otpExpires
      },
      select: { id: true, name: true, email: true, upiId: true, isAdmin: true, createdAt: true },
    });

    await prisma.portfolio.create({
      data: {
        userId: dbUser.id,
        cashBalance: 100000,
      },
    });

    // Send OTP email
    await sendOtpEmail(email, otp);

    return NextResponse.json(
      { success: true, email: dbUser.email, message: "Registration successful. Please check your email for the verification code." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
