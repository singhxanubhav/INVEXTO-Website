import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { signToken, hashPassword } from "@/src/lib/auth";
import type { ApiResponse, User } from "@/src/types";
import crypto from "crypto";
import jwt from "jsonwebtoken";
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
    
    const otpSetting = await prisma.systemSetting.findUnique({ where: { key: "requireOtpRegistration" } });
    const requireOtp = otpSetting ? otpSetting.value === "true" : true;

    if (requireOtp) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
      const pendingToken = jwt.sign(
        { name, email, passwordHash, upiId: upiId || null, otp, otpExpires },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      await sendOtpEmail(email, otp);

      return NextResponse.json(
        { success: true, data: { pendingToken, email }, message: "Registration successful. Please check your email for the verification code." },
        { status: 201 }
      );
    } else {
      const dbUser = await prisma.user.create({
        data: { name, email, passwordHash, upiId: upiId || null, emailVerified: true },
        select: { id: true, name: true, email: true, upiId: true, isAdmin: true, createdAt: true },
      });

      const autoEnrollSetting = await prisma.systemSetting.findUnique({ where: { key: "autoTournamentEnrollment" } });
      const autoEnroll = autoEnrollSetting ? autoEnrollSetting.value === "true" : true;

      let enrolled = false;
      if (autoEnroll) {
        const activeTournament = await prisma.tournament.findFirst({
          where: { status: "active" }
        });
        
        if (activeTournament) {
          await prisma.portfolio.create({
            data: {
              userId: dbUser.id,
              cashBalance: 100000,
              inTournament: true,
              tournamentId: activeTournament.id,
            },
          });
          
          await prisma.tournamentRegistration.create({
            data: {
              tournamentId: activeTournament.id,
              userId: dbUser.id,
            },
          });
          enrolled = true;
        }
      }

      if (!enrolled) {
        await prisma.portfolio.create({
          data: { userId: dbUser.id, cashBalance: 100000 },
        });
      }

      const token = await signToken({
        userId: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        isAdmin: dbUser.isAdmin,
      });
      
      const response = NextResponse.json(
        { success: true, data: { bypassedOtp: true }, message: "Registration successful." },
        { status: 201 }
      );

      response.cookies.set("invexto_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    }
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
