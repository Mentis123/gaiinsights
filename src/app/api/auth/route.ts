import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correctPassword = process.env.ACCESS_PASSWORD || "goteamgaiinsights";

  if (password === correctPassword) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("gai_auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  }

  return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
}
