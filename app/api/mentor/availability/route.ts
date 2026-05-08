import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile, {
  type IMentorAvailability,
} from "@/models/MentorProfile";

type AvailabilityInput = {
  day?: unknown;
  timeSlots?: unknown;
};

const MAX_AVAILABILITY_DAYS = 14;
const MAX_TIME_SLOTS_PER_DAY = 48;

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeAvailability(input: unknown): IMentorAvailability[] | null {
  if (!Array.isArray(input) || input.length > MAX_AVAILABILITY_DAYS) {
    return null;
  }

  const availability: IMentorAvailability[] = [];

  for (const item of input as AvailabilityInput[]) {
    const day = cleanText(item?.day, 30);

    if (!day || !Array.isArray(item?.timeSlots)) {
      return null;
    }

    if (item.timeSlots.length > MAX_TIME_SLOTS_PER_DAY) {
      return null;
    }

    const timeSlots = item.timeSlots
      .map((slot) => cleanText(slot, 20))
      .filter(Boolean);

    availability.push({ day, timeSlots: [...new Set(timeSlots)] });
  }

  return availability;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRole = String(session.user.role ?? "").toLowerCase();

    if (userRole !== "mentor") {
      return NextResponse.json(
        { message: "Forbidden. This feature is only available to mentors." },
        { status: 403 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { message: "Invalid authenticated user id." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const availability = normalizeAvailability(body?.availability);

    if (!availability) {
      return NextResponse.json(
        {
          message:
            "availability must be an array of { day, timeSlots } objects.",
        },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const mentorProfile = await MentorProfile.findOneAndUpdate(
      { userId: session.user.id },
      { $set: { availability } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ availability: mentorProfile.availability });
  } catch (error) {
    console.error("Mentor availability update error:", error);
    return NextResponse.json(
      { message: "Failed to update availability" },
      { status: 500 }
    );
  }
}
