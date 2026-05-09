import crypto from "crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";
import User from "@/models/User";

export const runtime = "nodejs";

function normalizeEmail(email: unknown): string {
  return String(email || "").trim().toLowerCase();
}

function buildTransporter() {
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const normalizedEmail = normalizeEmail(email);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Valid email is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const userExists = await User.findOne({ email: normalizedEmail }).select("_id");
    if (userExists) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: { otp, createdAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const transporter = buildTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: normalizedEmail,
      subject: "Your StudyBuddy Verification Code",
      text: `Your StudyBuddy verification code is ${otp}. This code expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2>Your StudyBuddy Verification Code</h2>
          <p>Use this code to finish creating your account:</p>
          <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${otp}</p>
          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Verification code sent." });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { message: "Failed to send verification code." },
      { status: 500 }
    );
  }
}
