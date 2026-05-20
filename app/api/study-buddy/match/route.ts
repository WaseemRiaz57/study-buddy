import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/connectDB";
import {
  activeStudyBuddyListingFilter,
  closeExpiredStudyBuddyListings,
  getStudyBuddyListingExpiry,
} from "@/lib/study-buddy-listings";
import BuddyMatch from "@/models/BuddyMatch";

export const dynamic = "force-dynamic";

function serializeListing(listing: any) {
  const student =
    listing.studentId && typeof listing.studentId === "object"
      ? listing.studentId
      : null;

  return {
    _id: String(listing._id),
    subject: listing.subject || "",
    topic: listing.topic || "",
    status: listing.status || "Searching",
    createdAt: listing.createdAt,
    student: student
      ? {
          _id: String(student._id),
          name: student.name || "Study Buddy",
          image: student.image || "",
        }
      : null,
  };
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const subject = String(searchParams.get("subject") || "").trim().slice(0, 100);
    const topic = String(searchParams.get("topic") || "").trim().slice(0, 160);

    if (!subject) {
      return NextResponse.json(
        { message: "Subject is required." },
        { status: 400 }
      );
    }

    await connectDB();
    await closeExpiredStudyBuddyListings();

    const studentId = new mongoose.Types.ObjectId(currentUserId);
    const activeFilter = activeStudyBuddyListingFilter();
    const matchedListing = await BuddyMatch.findOne({
      subject,
      ...activeFilter,
      studentId: { $ne: studentId },
    })
      .sort({ createdAt: 1 })
      .populate("studentId", "name image")
      .lean();

    if (matchedListing) {
      return NextResponse.json({
        matchFound: true,
        listing: serializeListing(matchedListing),
      });
    }

    let listing = await BuddyMatch.findOne({
      studentId,
      subject,
      ...activeFilter,
    }).lean();

    if (!listing) {
      listing = await BuddyMatch.create({
        studentId,
        subject,
        topic,
        status: "Searching",
        expiresAt: getStudyBuddyListingExpiry(),
      }).then((createdListing) => createdListing.toObject());
    }

    return NextResponse.json({
      matchFound: false,
      listing: serializeListing(listing),
      message: "No open listings right now for this subject.",
    });
  } catch (error) {
    console.error("Study Buddy Match Error:", error);
    return NextResponse.json(
      { message: "Internal server error while finding a match." },
      { status: 500 }
    );
  }
}


