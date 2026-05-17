import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/connectDB";
import BuddyMatch from "@/models/BuddyMatch";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = String(session?.user?.id || "").trim();

    if (!currentUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Invalid listing id." },
        { status: 400 }
      );
    }

    await connectDB();

    const listing = await BuddyMatch.findById(id);

    if (!listing) {
      return NextResponse.json(
        { message: "Listing not found." },
        { status: 404 }
      );
    }

    if (String(listing.studentId) !== currentUserId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await BuddyMatch.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Listing deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Study Buddy Listing Error:", error);
    return NextResponse.json(
      { message: "Internal server error while deleting listing." },
      { status: 500 }
    );
  }
}


