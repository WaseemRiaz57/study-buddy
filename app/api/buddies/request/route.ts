import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import { closeExpiredStudyBuddyListings } from "@/lib/study-buddy-listings";
import BuddyMatch from "@/models/BuddyMatch";
import BuddyConnection from "@/models/BuddyConnection";
import User from "@/models/User";
import mongoose from "mongoose";

interface RequestBody {
  listingId?: string;
  recipientId?: string;
  subject?: string;
}

// POST /api/buddies/request
export async function POST(req: Request) {
  const { error, session } = await requireRole("student");
  if (error) return error;

  try {
    const body = (await req.json()) as RequestBody;
    const listingId = String(body.listingId || "").trim();
    let recipientId = String(body.recipientId || "").trim();
    let subject = String(body.subject || "").trim().slice(0, 100);
    const requesterId = session!.user.id;

    await connectMongoDB();
    await closeExpiredStudyBuddyListings();

    if (listingId) {
      if (!mongoose.Types.ObjectId.isValid(listingId)) {
        return NextResponse.json(
          { message: "Valid listingId is required" },
          { status: 400 }
        );
      }

      const listing = await BuddyMatch.findById(listingId).populate(
        "studentId",
        "_id role"
      );

      const expiresAt = listing?.expiresAt ? new Date(listing.expiresAt).getTime() : null;

      if (
        !listing ||
        listing.status !== "Searching" ||
        (expiresAt !== null && Number.isFinite(expiresAt) && expiresAt <= Date.now())
      ) {
        return NextResponse.json(
          { message: "Listing is no longer available" },
          { status: 404 }
        );
      }

      const owner =
        listing.studentId && typeof listing.studentId === "object"
          ? (listing.studentId as { _id?: mongoose.Types.ObjectId; role?: string })
          : null;
      const ownerId = String(owner?._id || "").trim();

      if (!ownerId) {
        return NextResponse.json(
          { message: "Listing owner could not be found" },
          { status: 404 }
        );
      }

      if (owner?.role && String(owner.role).toLowerCase() !== "student") {
        return NextResponse.json(
          { message: "Listing owner is unavailable" },
          { status: 404 }
        );
      }

      recipientId = ownerId;
      subject = String(listing.subject || subject).trim().slice(0, 100);
    }

    if (!mongoose.Types.ObjectId.isValid(recipientId) || !subject) {
      return NextResponse.json(
        { message: "Valid recipientId and subject are required" },
        { status: 400 }
      );
    }

    if (requesterId === recipientId) {
      return NextResponse.json(
        { message: "You cannot send a request to yourself" },
        { status: 400 }
      );
    }

    const recipient = await User.findOne({ _id: recipientId, role: "student" }).select("_id");
    if (!recipient) {
      return NextResponse.json(
        { message: "Recipient not found or unavailable" },
        { status: 404 }
      );
    }

    const existingConnection = await BuddyConnection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
      status: { $in: ["pending", "accepted", "rejected"] },
    }).lean();

    if (existingConnection) {
      return NextResponse.json(
        { message: "Request already exists" },
        { status: 400 }
      );
    }

    const createdConnection = await BuddyConnection.create({
      requester: requesterId,
      recipient: recipientId,
      subject,
      status: "pending",
    });

    return NextResponse.json(
      {
        message: "Buddy request sent successfully",
        connection: createdConnection,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Buddy Request Error:", err);
    return NextResponse.json(
      { message: "Internal server error while sending request" },
      { status: 500 }
    );
  }
}


