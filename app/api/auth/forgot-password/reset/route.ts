import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import Otp from "@/models/Otp";
import User from "@/models/User";

function normalizeEmail(email: unknown): string {
  return String(email || "").trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json();
    const normalizedEmail = normalizeEmail(email);
    const normalizedOtp = String(otp || "").trim();
    const password = String(newPassword || "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Valid email is required." },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(normalizedOtp)) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { message: "Password must be between 8 and 128 characters." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    const otpRecord = await Otp.findOne({ email: normalizedEmail });
    if (!otpRecord || otpRecord.otp !== normalizedOtp) {
      return NextResponse.json(
        { message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    user.password = await hashPassword(password);
    await user.save();
    await Otp.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Failed to reset password." },
      { status: 500 }
    );
  }
}


