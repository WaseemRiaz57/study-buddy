import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import { createStudyBuddyMatchRoom } from "@/lib/study-buddy-match-room";
import {
  emitBuddyRequestAccepted,
  emitBuddyRequestDeclined,
  emitUserNotification,
} from "@/lib/study-room-socket";
import { emitSocketEventToUser } from "@/lib/server-socket-emit";
import BuddyMatch from "@/models/BuddyMatch";
import BuddyConnection from "@/models/BuddyConnection";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

interface RespondBody {
  connectionId?: string;
  action?: "accept" | "decline";
}

// PATCH /api/buddies/requests/respond
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          ok: false,
          message: "Unauthorized. Please log in to respond to buddy requests.",
        },
        { status: 401 }
      );
    }

    const { connectionId, action } = (await req.json()) as RespondBody;

    if (!mongoose.Types.ObjectId.isValid(connectionId || "") || !action || !["accept", "decline"].includes(action)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Valid connectionId and action ('accept' | 'decline') are required.",
        },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const connection = await BuddyConnection.findById(connectionId);
    if (!connection) {
      return NextResponse.json(
        {
          ok: false,
          message: "Buddy request not found.",
        },
        { status: 404 }
      );
    }

    if (String(connection.recipient) !== session.user.id) {
      return NextResponse.json(
        {
          ok: false,
          message: "Forbidden. Only the recipient can respond to this buddy request.",
        },
        { status: 403 }
      );
    }

    if (action === "accept") {
      const requesterId = String(connection.requester);
      const room = await createStudyBuddyMatchRoom({
        hostId: session.user.id,
        peerId: requesterId,
        subject: connection.subject,
      });

      connection.status = "accepted";
      connection.roomId = room.roomId;
      await connection.save();

      if (connection.listingId) {
        await BuddyMatch.findByIdAndUpdate(connection.listingId, {
          $set: {
            status: "Completed",
            matchedPeerId: connection.requester,
            roomId: room.roomObjectId,
          },
        });
      }

      const notification = await Notification.create({
        userId: requesterId,
        recipientId: requesterId,
        senderId: session.user.id,
        type: "buddy_accepted",
        title: "Study Buddy Request Accepted",
        message: `${session.user.name || "Your study buddy"} accepted your request. Your room is ready.`,
        read: false,
        metadata: {
          connectionId: String(connection._id),
          roomId: room.roomId,
          subject: connection.subject,
        },
      });

      emitBuddyRequestAccepted(requesterId, {
        roomId: room.roomId,
        requestId: String(connection._id),
      });
      emitUserNotification(requesterId, notification.toObject());
      await Promise.all([
        emitSocketEventToUser({
          userId: requesterId,
          event: "buddy-request-accepted",
          payload: {
            roomId: room.roomId,
            requestId: String(connection._id),
          },
        }),
        emitSocketEventToUser({
          userId: requesterId,
          event: "notification:new",
          payload: notification.toObject(),
        }),
      ]);

      return NextResponse.json(
        {
          ok: true,
          message: "Study buddy request accepted successfully.",
          roomId: room.roomId,
          connection,
        },
        { status: 200 }
      );
    }

    // Decline flow: remove pending request record to keep queue clean.
    const requesterId = String(connection.requester);
    if (connection.listingId) {
      await BuddyMatch.findOneAndUpdate(
        {
          _id: connection.listingId,
          status: "Pending",
        },
        {
          $set: { status: "Searching" },
          $unset: { matchedPeerId: "" },
        }
      );
    }
    await BuddyConnection.findByIdAndDelete(connectionId);
    const notification = await Notification.create({
      userId: requesterId,
      recipientId: requesterId,
      senderId: session.user.id,
      type: "system",
      title: "Study Buddy Request Declined",
      message: `${session.user.name || "Your study buddy"} declined your request.`,
      read: false,
      metadata: {
        connectionId,
        subject: connection.subject,
      },
    });
    emitUserNotification(requesterId, notification.toObject());
    emitBuddyRequestDeclined(requesterId, {
      requestId: connectionId || "",
      subject: connection.subject,
      responderName: session.user.name || "Your study buddy",
    });
    await Promise.all([
      emitSocketEventToUser({
        userId: requesterId,
        event: "buddy-request-declined",
        payload: {
          requestId: connectionId,
          subject: connection.subject,
          responderName: session.user.name || "Your study buddy",
        },
      }),
      emitSocketEventToUser({
        userId: requesterId,
        event: "notification:new",
        payload: notification.toObject(),
      }),
    ]);

    return NextResponse.json(
      {
        ok: true,
        message: "Study buddy request declined successfully.",
        connectionId,
        action,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Respond Buddy Request Error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: "Internal server error while responding to buddy request.",
      },
      { status: 500 }
    );
  }
}


