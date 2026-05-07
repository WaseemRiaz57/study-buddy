import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";

function normalizeEmail(email: unknown): string {
  return String(email || "").trim().toLowerCase();
}

function normalizeRole(role: unknown): "student" | "mentor" {
  return String(role).toLowerCase() === "mentor" ? "mentor" : "student";
}

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();
    const normalizedName = String(name || "").trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = String(password || "");
    const normalizedRole = normalizeRole(role);

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      return NextResponse.json(
        { message: "Name must be between 2 and 80 characters." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ message: "Valid email is required." }, { status: 400 });
    }

    if (normalizedPassword.length < 8 || normalizedPassword.length > 128) {
      return NextResponse.json(
        { message: "Password must be between 8 and 128 characters." },
        { status: 400 }
      );
    }

    // Database connect karein
    await connectMongoDB();

    // Check karein agar user pehle se hai
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return NextResponse.json({ message: "User already exists!" }, { status: 400 });
    }

    // Naya user save karein
    await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: await hashPassword(normalizedPassword),
      role: normalizedRole,
    });

    return NextResponse.json({ message: "User registered successfully!" }, { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: "Error registering user." }, { status: 500 });
  }
}
