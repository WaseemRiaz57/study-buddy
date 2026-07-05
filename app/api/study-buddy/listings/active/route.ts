import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import {
  activeStudyBuddyListingFilter,
  closeExpiredStudyBuddyListings,
} from "@/lib/study-buddy-listings";
import BuddyMatch from "@/models/BuddyMatch";

export const dynamic = "force-dynamic";

type ListingStudent = {
  _id?: unknown;
  name?: string | null;
  image?: string | null;
};

type StudyBuddyListing = {
  _id: unknown;
  subject?: string | null;
  topic?: string | null;
  status?: string | null;
  createdAt?: Date | string;
  studentId?: ListingStudent | unknown;
};

function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    const errorWithCode = error as unknown as { code?: unknown };
    const code =
      typeof errorWithCode.code === "number" ? errorWithCode.code : undefined;

    return {
      name: error.name,
      message: error.message,
      code,
    };
  }

  return {
    name: "UnknownError",
    message: "Unknown error",
  };
}

function isListingStudent(value: unknown): value is ListingStudent {
  return Boolean(value && typeof value === "object" && "_id" in value);
}

function serializeListing(listing: StudyBuddyListing) {
  const student = isListingStudent(listing.studentId) ? listing.studentId : null;

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
    // connectMongoDB() MUST be the first awaited call so Vercel serverless
    // functions always have an active DB connection before any Mongoose work.
    await connectMongoDB();

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

    const studentId = new mongoose.Types.ObjectId(currentUserId);

    try {
      try {
        await closeExpiredStudyBuddyListings();
      } catch (dbError: any) {
        console.error("Auto-expiration update failed:", dbError);
        
        // Return a structured JSON 500 error for database update failures (e.g., E11000 duplicate key error)
        return NextResponse.json(
          {
            message: "Database update failed during auto-expiration. A duplicate record may exist.",
            code: dbError?.code === 11000 ? "DUPLICATE_KEY_ERROR" : "UPDATE_FAILED",
            error: getErrorDetails(dbError),
          },
          { status: 500 }
        );
      }

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
        myListings: Array.isArray(myListings)
          ? myListings.map(serializeListing)
          : [],
        otherListings: Array.isArray(otherListings)
          ? otherListings.map(serializeListing)
          : [],
      });
    } catch (error) {
      console.error("Active Study Buddy listings query failed:", {
        ...getErrorDetails(error),
        route: "/api/study-buddy/listings/active",
      });

      return NextResponse.json(
        {
          message: "Failed to load active Study Buddy listings.",
          code: "STUDY_BUDDY_ACTIVE_LISTINGS_FAILED",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Active Study Buddy listings request failed:", {
      ...getErrorDetails(error),
      route: "/api/study-buddy/listings/active",
    });

    return NextResponse.json(
      {
        message: "Failed to load active Study Buddy listings.",
        code: "STUDY_BUDDY_ACTIVE_LISTINGS_FAILED",
      },
      { status: 500 }
    );
  }
}
