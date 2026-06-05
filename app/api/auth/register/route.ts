import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { signToken, hashPassword } from "@/src/lib/auth";
import type { ApiResponse, User } from "@/src/types";

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

    const dbUser = await prisma.user.create({
      data: { name, email, passwordHash, upiId: upiId || null },
      select: { id: true, name: true, email: true, upiId: true, createdAt: true },
    });

    await prisma.portfolio.create({
      data: {
        userId: dbUser.id,
        cashBalance: 100000,
      },
    });

    const token = signToken({
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
    });

    const user: User = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      upiId: dbUser.upiId,
      createdAt: dbUser.createdAt.toISOString(),
    };

    const response = NextResponse.json(
      { success: true, data: user } satisfies ApiResponse<User>,
      { status: 201 }
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
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
