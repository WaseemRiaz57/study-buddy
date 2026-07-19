import crypto from "crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";
import User from "@/models/User";

export const runtime = "nodejs";

const siteUrl = (
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
const brandLogoUrl = `${siteUrl}/logo.png`;

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

function buildOtpEmailHtml(otp: string) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Your StudyBuddy Verification Code</title>
      </head>
      <body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc; margin:0; padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; overflow:hidden;">
                <tr>
                  <td style="padding:32px 32px 16px 32px; text-align:center;">
                    <img src="${brandLogoUrl}" alt="StudyBuddy" width="64" height="64" style="display:block; width:64px; height:64px; margin:0 auto; object-fit:contain;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 32px 0 32px;">
                    <h1 style="margin:0; font-size:24px; line-height:1.3; color:#111827; text-align:center;">Verify your email</h1>
                    <p style="margin:16px 0 0 0; font-size:16px; line-height:1.6; color:#374151; text-align:center;">
                      Hi there, welcome to StudyBuddy. Use the verification code below to finish creating your account.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px;">
                    <div style="background:#f5f3ff; border:2px solid #7C3AED; border-radius:16px; padding:22px 16px; text-align:center;">
                      <div style="font-size:34px; line-height:1; font-weight:800; letter-spacing:10px; color:#4c1d95;">${otp}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 32px 32px;">
                    <p style="margin:0; font-size:14px; line-height:1.6; color:#6b7280; text-align:center;">
                      This code expires in 10 minutes. If you didn't request this, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
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
    const text = [
      "Your StudyBuddy Verification Code",
      "",
      `Your verification code is ${otp}.`,
      "This code expires in 10 minutes.",
      "If you didn't request this, please ignore this email.",
    ].join("\n");

    await transporter.sendMail({
      from: `"StudyBuddy" <${process.env.SMTP_USER}>`,
      to: normalizedEmail,
      subject: "Your StudyBuddy Verification Code",
      text,
      html: buildOtpEmailHtml(otp),
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


