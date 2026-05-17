import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import Notification from "@/models/Notification";
import Resource from "@/models/Resource";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";

export const dynamic = "force-dynamic";

function getProfileModel(role: unknown) {
  return String(role || "").toLowerCase() === "mentor"
    ? MentorProfile
    : StudentProfile;
}

function hasUnlockedResource(resource: any, userId: string) {
  const price = Number(resource.price || 0);

  if (price === 0) return true;

  return Array.isArray(resource.allowedUsers)
    ? resource.allowedUsers.some(
        (allowedUserId: unknown) => String(allowedUserId) === userId
      )
    : false;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id: resourceId } = await params;

  if (!mongoose.Types.ObjectId.isValid(resourceId)) {
    return NextResponse.json(
      { message: "Valid resource id is required." },
      { status: 400 }
    );
  }

  await connectMongoDB();

  const resource = await Resource.findById(resourceId).lean();

  if (!resource || resource.status !== "approved") {
    return NextResponse.json(
      { message: "Resource is not available." },
      { status: 404 }
    );
  }

  if (hasUnlockedResource(resource, session.user.id)) {
    return NextResponse.json({
      success: true,
      message: "Resource already unlocked.",
      isUnlocked: true,
      fileUrl: resource.fileUrl,
    });
  }

  const price = Math.floor(Number(resource.price || 0));

  if (price <= 0) {
    await Resource.findByIdAndUpdate(resourceId, {
      $addToSet: { allowedUsers: session.user.id },
    });

    return NextResponse.json({
      success: true,
      message: "Resource unlocked.",
      isUnlocked: true,
      fileUrl: resource.fileUrl,
    });
  }

  const buyerId = new mongoose.Types.ObjectId(session.user.id);
  const uploaderId = new mongoose.Types.ObjectId(String(resource.uploadedBy));

  if (buyerId.equals(uploaderId)) {
    await Resource.findByIdAndUpdate(resourceId, {
      $addToSet: { allowedUsers: buyerId },
    });

    return NextResponse.json({
      success: true,
      message: "Resource unlocked.",
      isUnlocked: true,
      fileUrl: resource.fileUrl,
    });
  }

  const [buyer, uploader] = await Promise.all([
    User.findById(buyerId).select("name role").lean(),
    User.findById(uploaderId).select("name role").lean(),
  ]);

  if (!buyer || !uploader) {
    return NextResponse.json(
      { message: "Buyer or uploader was not found." },
      { status: 404 }
    );
  }

  const BuyerProfileModel = getProfileModel(buyer.role);
  const UploaderProfileModel = getProfileModel(uploader.role);
  const dbSession = await mongoose.startSession();

  try {
    let updatedBuyerProfile: any = null;

    await dbSession.withTransaction(async () => {
      updatedBuyerProfile = await BuyerProfileModel.findOneAndUpdate(
        {
          userId: buyerId,
          coins: { $gte: price },
        },
        { $inc: { coins: -price } },
        { new: true, runValidators: true, session: dbSession }
      ).lean();

      if (!updatedBuyerProfile) {
        throw new Error("INSUFFICIENT_COINS");
      }

      await UploaderProfileModel.findOneAndUpdate(
        { userId: uploaderId },
        {
          $setOnInsert: { userId: uploaderId },
          $inc: { coins: price },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
          session: dbSession,
        }
      );

      await Resource.findByIdAndUpdate(
        resourceId,
        {
          $addToSet: { allowedUsers: buyerId },
        },
        { session: dbSession }
      );
    });

    await Notification.create({
      userId: uploaderId,
      recipientId: uploaderId,
      senderId: buyerId,
      type: "system",
      title: "Resource Purchased",
      message: `${buyer.name || "A user"} purchased your notes ${resource.title} for ${price} coins! \u{1FA99}`,
      read: false,
      metadata: {
        resourceId,
        buyerId: session.user.id,
        price,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Unlocked for ${price} coins.`,
      isUnlocked: true,
      fileUrl: resource.fileUrl,
      buyer: {
        coins: Number(updatedBuyerProfile?.coins || 0),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_COINS") {
      return NextResponse.json(
        { message: "Insufficient coin balance." },
        { status: 400 }
      );
    }

    console.error("Resource purchase error:", error);
    return NextResponse.json(
      { message: "Failed to purchase resource." },
      { status: 500 }
    );
  } finally {
    await dbSession.endSession();
  }
}


