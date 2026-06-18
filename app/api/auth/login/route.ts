import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { signToken, comparePassword } from "@/src/lib/auth";
import type { ApiResponse, User } from "@/src/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { success: false, error: "Please verify your email before logging in. Check your inbox for the verification code." },
        { status: 403 }
      );
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
    });

    const userData: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      upiId: user.upiId,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt.toISOString(),
    };

    const response = NextResponse.json(
      { success: true, data: userData } satisfies ApiResponse<User>
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
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
