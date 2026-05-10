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
  slots?: unknown;
  timeSlots?: unknown;
};

const MAX_AVAILABILITY_DAYS = 14;
const MAX_TIME_SLOTS_PER_DAY = 24;

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function parseMeridiemTimeToMinutes(
  hour: string,
  minute: string,
  meridiem: string
) {
  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);

  if (
    !Number.isInteger(parsedHour) ||
    !Number.isInteger(parsedMinute) ||
    parsedHour < 1 ||
    parsedHour > 12 ||
    parsedMinute < 0 ||
    parsedMinute > 59
  ) {
    return null;
  }

  const hour24 =
    meridiem.toUpperCase() === "AM"
      ? parsedHour === 12
        ? 0
        : parsedHour
      : parsedHour === 12
        ? 12
        : parsedHour + 12;

  return hour24 * 60 + parsedMinute;
}

function isOneHourSlot(slot: string) {
  const match = slot.match(
    /^(\d{1,2}):([0-5]\d)\s*(AM|PM)\s*-\s*(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i
  );

  if (!match) return false;

  const start = parseMeridiemTimeToMinutes(match[1], match[2], match[3]);
  const end = parseMeridiemTimeToMinutes(match[4], match[5], match[6]);

  if (start === null || end === null) return false;

  const duration = end > start ? end - start : end + 24 * 60 - start;
  return duration === 60;
}

function normalizeAvailability(input: unknown): IMentorAvailability[] | null {
  if (!Array.isArray(input) || input.length > MAX_AVAILABILITY_DAYS) {
    return null;
  }

  const availability: IMentorAvailability[] = [];

  for (const item of input as AvailabilityInput[]) {
    const day = cleanText(item?.day, 30);

    const incomingSlots = Array.isArray(item?.slots)
      ? item.slots
      : Array.isArray(item?.timeSlots)
        ? item.timeSlots
        : null;

    if (!day || !incomingSlots) {
      return null;
    }

    if (incomingSlots.length > MAX_TIME_SLOTS_PER_DAY) {
      return null;
    }

    const slots = incomingSlots
      .map((slot) => cleanText(slot, 20))
      .filter(Boolean);

    const uniqueSlots = [...new Set(slots)];

    if (!uniqueSlots.every(isOneHourSlot)) {
      return null;
    }

    availability.push({ day, slots: uniqueSlots, timeSlots: uniqueSlots });
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
            "availability must be an array of { day, slots } with 1-hour slots like '09:00 AM - 10:00 AM'.",
        },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const mentorProfile = await MentorProfile.findOneAndUpdate(
      { userId: session.user.id },
      {
        $set: { availability },
        $setOnInsert: {
          userId: session.user.id,
          status: "pending",
          isPublic: false,
        },
      },
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
