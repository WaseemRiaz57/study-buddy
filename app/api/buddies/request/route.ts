import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-guard";
import { connectMongoDB } from "@/lib/mongodb";
import { closeExpiredStudyBuddyListings } from "@/lib/study-buddy-listings";
import BuddyMatch from "@/models/BuddyMatch";
import BuddyConnection from "@/models/BuddyConnection";
import Notification from "@/models/Notification";
import User from "@/models/User";
import {
  emitBuddyRequestCreated,
  emitUserNotification,
} from "@/lib/study-room-socket";
import { emitSocketEventToUser } from "@/lib/server-socket-emit";
import mongoose from "mongoose";

interface RequestBody {
  listingId?: string;
  recipientId?: string;
  subject?: string;
}

// POST /api/buddies/request
export async function POST(req: Request) {
  try {
    const { error, session } = await requireRole("student");
    if (error) return error;

    const requesterId = String(session?.user?.id || "").trim();

    if (!mongoose.Types.ObjectId.isValid(requesterId)) {
      return NextResponse.json(
        { message: "Invalid user session." },
        { status: 400 }
      );
    }

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    const listingId = String(body.listingId || "").trim();
    let recipientId = String(body.recipientId || "").trim();
    let subject = String(body.subject || "").trim().slice(0, 100);

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

    const requesterObjectId = new mongoose.Types.ObjectId(requesterId);
    const recipientObjectId = new mongoose.Types.ObjectId(recipientId);
    const listingObjectId = listingId
      ? new mongoose.Types.ObjectId(listingId)
      : null;

    const recipient = await User.findOne({
      _id: recipientObjectId,
      role: "student",
    }).select("_id");

    if (!recipient) {
      return NextResponse.json(
        { message: "Recipient not found or unavailable" },
        { status: 404 }
      );
    }

    if (listingObjectId) {
      await BuddyMatch.findByIdAndUpdate(listingObjectId, {
        $set: {
          status: "Pending",
          matchedPeerId: requesterObjectId,
        },
      });
    }

    const existingConnection = await BuddyConnection.findOne({
      $or: [
        { requester: requesterObjectId, recipient: recipientObjectId },
        { requester: recipientObjectId, recipient: requesterObjectId },
      ],
      status: { $in: ["pending", "accepted", "rejected"] },
    }).lean();

    if (existingConnection) {
      const refreshedConnection = await BuddyConnection.findByIdAndUpdate(
        existingConnection._id,
        {
          $set: {
            subject,
            status:
              String(existingConnection.status) === "accepted"
                ? existingConnection.status
                : "pending",
            ...(listingObjectId ? { listingId: listingObjectId } : {}),
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      const requester = await User.findById(requesterObjectId)
        .select("_id name image subjects")
        .lean();
      const connectionId = String(existingConnection._id);
      const buddyRequestPayload = {
        connectionId,
        subject,
        requester: {
          _id: requesterId,
          name: requester?.name || "A student",
          image: (requester as { image?: string } | null)?.image || "",
          subjects: Array.isArray((requester as { subjects?: string[] } | null)?.subjects)
            ? (requester as { subjects?: string[] }).subjects
            : [],
        },
      };
      const notification = await Notification.create({
        userId: recipientObjectId,
        recipientId: recipientObjectId,
        senderId: requesterObjectId,
        type: "buddy_request",
        title: "Study Buddy Ping",
        message: `${requester?.name || "A student"} pinged you again for ${subject}.`,
        read: false,
        metadata: {
          connectionId,
          subject,
          reping: true,
        },
      });

      emitBuddyRequestCreated(recipientId, buddyRequestPayload);
      emitUserNotification(recipientId, notification.toObject());
      await Promise.all([
        emitSocketEventToUser({
          userId: recipientId,
          event: "buddy-request-created",
          payload: buddyRequestPayload,
        }),
        emitSocketEventToUser({
          userId: recipientId,
          event: "notification:new",
          payload: notification.toObject(),
        }),
      ]);

      return NextResponse.json(
        {
          message: "Buddy ping refreshed successfully",
          connection: refreshedConnection || existingConnection,
        },
        { status: 200 }
      );
    }

    const createdConnection = await BuddyConnection.create({
      requester: requesterObjectId,
      recipient: recipientObjectId,
      ...(listingObjectId ? { listingId: listingObjectId } : {}),
      subject,
      status: "pending",
    });

    const requester = await User.findById(requesterObjectId)
      .select("_id name image subjects")
      .lean();
    const buddyRequestPayload = {
      connectionId: String(createdConnection._id),
      subject,
      requester: {
        _id: requesterId,
        name: requester?.name || "A student",
        image: (requester as { image?: string } | null)?.image || "",
        subjects: Array.isArray((requester as { subjects?: string[] } | null)?.subjects)
          ? (requester as { subjects?: string[] }).subjects
          : [],
      },
    };
    const notification = await Notification.create({
      userId: recipientObjectId,
      recipientId: recipientObjectId,
      senderId: requesterObjectId,
      type: "buddy_request",
      title: "New Study Buddy Ping",
      message: `${requester?.name || "A student"} wants to connect for ${subject}.`,
      read: false,
      metadata: {
        connectionId: String(createdConnection._id),
        subject,
      },
    });

    emitBuddyRequestCreated(recipientId, buddyRequestPayload);
    emitUserNotification(recipientId, notification.toObject());
    await Promise.all([
      emitSocketEventToUser({
        userId: recipientId,
        event: "buddy-request-created",
        payload: buddyRequestPayload,
      }),
      emitSocketEventToUser({
        userId: recipientId,
        event: "notification:new",
        payload: notification.toObject(),
      }),
    ]);

    return NextResponse.json(
      {
        message: "Buddy request sent successfully",
        connection: createdConnection,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    console.error("Buddy Request Error:", error);
    return NextResponse.json(
      { message: "Internal server error while sending request" },
      { status: 500 }
    );
  }
}


