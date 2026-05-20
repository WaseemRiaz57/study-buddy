import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/connectDB";
import {
  activeStudyBuddyListingFilter,
  closeExpiredStudyBuddyListings,
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

export async function GET() {
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

    await connectDB();
    await closeExpiredStudyBuddyListings();

    const studentId = new mongoose.Types.ObjectId(currentUserId);
    const activeFilter = activeStudyBuddyListingFilter();
    const [myListings, otherListings] = await Promise.all([
      BuddyMatch.find({ studentId, ...activeFilter })
        .sort({ createdAt: -1 })
        .lean(),
      BuddyMatch.find({
        studentId: { $ne: studentId },
        ...activeFilter,
      })
        .sort({ createdAt: -1 })
        .populate("studentId", "name image")
        .lean(),
    ]);

    return NextResponse.json({
      myListings: myListings.map(serializeListing),
      otherListings: otherListings.map(serializeListing),
    });
  } catch (error) {
    console.error("Active Study Buddy Listings Error:", error);
    return NextResponse.json(
      { message: "Internal server error while fetching listings." },
      { status: 500 }
    );
  }
}


