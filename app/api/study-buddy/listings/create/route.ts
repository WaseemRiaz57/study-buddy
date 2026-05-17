import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/connectDB";
import BuddyMatch from "@/models/BuddyMatch";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = String(session?.user?.id || "").trim();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(currentUserId)) {
      return NextResponse.json(
        { message: "Invalid user session." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const subject = String(body?.subject || "").trim();
    const topic = String(body?.topic || "").trim();

    if (!subject) {
      return NextResponse.json(
        { message: "Subject is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const studentId = new mongoose.Types.ObjectId(currentUserId);
    const existingListing = await BuddyMatch.findOne({
      studentId,
      subject,
      status: "Searching",
    }).lean();

    if (existingListing) {
      return NextResponse.json(
        { message: "You already have an active listing for this subject" },
        { status: 400 }
      );
    }

    const listing = await BuddyMatch.create({
      studentId,
      subject,
      topic,
      status: "Searching",
    });

    return NextResponse.json(
      {
        message: "Listing created.",
        listing,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Study Buddy Listing Error:", error);
    return NextResponse.json(
      { message: "Internal server error while creating listing." },
      { status: 500 }
    );
  }
}


