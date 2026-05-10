import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";

const MAX_BIO_LENGTH = 500;
const MAX_CERTIFICATE_LENGTH = 3 * 1024 * 1024;
const STUDENT_PROFILE_FIELDS = [
  "headline",
  "bio",
  "academicLevel",
  "primaryGoal",
  "interestedSubjects",
  "weeklyCommitment",
  "preferredStudyTimes",
  "socraticAiMode",
  "strictMentorship",
] as const;
const MENTOR_ONLY_FIELDS = [
  "subjects",
  "hourlyRate",
  "availability",
  "certificates",
  "submitForReview",
  "status",
  "isPublic",
] as const;

const emptyStudentProfile = {
  headline: "",
  bio: "",
  academicLevel: "",
  primaryGoal: "",
  interestedSubjects: [],
  weeklyCommitment: 0,
  preferredStudyTimes: [],
  socraticAiMode: false,
  strictMentorship: false,
  subscriptionTier: "Standard",
};

const emptyMentorProfile = {
  headline: "",
  bio: "",
  subjects: [],
  hourlyRate: 0,
  certificates: [],
  totalEarnings: 0,
  rating: 0,
  availability: [],
  status: "pending",
  isPublic: false,
};

function normalizeRole(role: unknown) {
  return String(role ?? "").toLowerCase();
}

function normalizeString(value: unknown, maxLength?: number) {
  const normalized = String(value ?? "").trim();
  return typeof maxLength === "number"
    ? normalized.slice(0, maxLength)
    : normalized;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => normalizeString(item, 100))
    .filter(Boolean);
}

function normalizeCertificateArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => normalizeString(item, MAX_CERTIFICATE_LENGTH))
    .filter(Boolean)
    .slice(0, 10);
}

function hasAnyField(body: Record<string, unknown>, fields: readonly string[]) {
  return fields.some((field) =>
    Object.prototype.hasOwnProperty.call(body, field)
  );
}

function getIncomingValue(body: Record<string, unknown>, field: string) {
  const aliases: Record<string, string[]> = {
    bio: ["about"],
    primaryGoal: ["goal"],
    interestedSubjects: ["tags", "subjects"],
    weeklyCommitment: ["hours"],
    preferredStudyTimes: ["times"],
    socraticAiMode: ["socratic"],
    strictMentorship: ["strict"],
  };

  if (Object.prototype.hasOwnProperty.call(body, field)) {
    return body[field];
  }

  return aliases[field]?.find((alias) =>
    Object.prototype.hasOwnProperty.call(body, alias)
  )
    ? body[aliases[field].find((alias) =>
        Object.prototype.hasOwnProperty.call(body, alias)
      ) as string]
    : undefined;
}

function buildNameUpdate(body: Record<string, unknown>) {
  const hasFirstName = Object.prototype.hasOwnProperty.call(body, "firstName");
  const hasLastName = Object.prototype.hasOwnProperty.call(body, "lastName");

  if (hasFirstName || hasLastName) {
    const fullName = [
      normalizeString(body.firstName, 80),
      normalizeString(body.lastName, 80),
    ]
      .filter(Boolean)
      .join(" ");

    return fullName || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const name = normalizeString(body.name, 160);
    return name || null;
  }

  return undefined;
}

function buildStudentProfileUpdate(body: Record<string, unknown>) {
  const update: Record<string, unknown> = {};

  for (const field of STUDENT_PROFILE_FIELDS) {
    const value = getIncomingValue(body, field);
    if (typeof value === "undefined") continue;

    if (field === "bio") {
      update[field] = normalizeString(value, MAX_BIO_LENGTH);
    } else if (field === "interestedSubjects" || field === "preferredStudyTimes") {
      update[field] = normalizeStringArray(value);
    } else if (field === "weeklyCommitment") {
      const weeklyCommitment = Number(value);
      update[field] = Number.isFinite(weeklyCommitment)
        ? Math.max(0, weeklyCommitment)
        : 0;
    } else if (field === "socraticAiMode" || field === "strictMentorship") {
      update[field] = Boolean(value);
    } else {
      update[field] = normalizeString(value, 200);
    }
  }

  return update;
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

  const normalizedMeridiem = meridiem.toUpperCase();
  const hour24 =
    normalizedMeridiem === "AM"
      ? parsedHour === 12
        ? 0
        : parsedHour
      : parsedHour === 12
        ? 12
        : parsedHour + 12;

  return hour24 * 60 + parsedMinute;
}

function isOneHourSlot(value: string) {
  const match = value.match(
    /^(\d{1,2}):([0-5]\d)\s*(AM|PM)\s*-\s*(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i
  );

  if (!match) return false;

  const start = parseMeridiemTimeToMinutes(match[1], match[2], match[3]);
  const end = parseMeridiemTimeToMinutes(match[4], match[5], match[6]);

  if (start === null || end === null) return false;

  const duration = end > start ? end - start : end + 24 * 60 - start;
  return duration === 60;
}

function normalizeMentorAvailability(value: unknown) {
  if (!Array.isArray(value)) return null;

  const availability = value.map((item) => {
    const record = item as {
      day?: unknown;
      slots?: unknown;
      timeSlots?: unknown;
    };
    const day = normalizeString(record?.day, 30);
    const incomingSlots = Array.isArray(record?.slots)
      ? record.slots
      : Array.isArray(record?.timeSlots)
        ? record.timeSlots
        : null;

    if (!day || !incomingSlots) {
      return null;
    }

    const slots = [
      ...new Set(
        incomingSlots
          .map((slot) => normalizeString(slot, 30).replace(/\s+/g, " "))
          .filter(Boolean)
      ),
    ];

    if (!slots.every(isOneHourSlot)) {
      return null;
    }

    return { day, slots, timeSlots: slots };
  });

  return availability.some((item) => item === null) ? null : availability;
}

function buildMentorProfileUpdate(body: Record<string, unknown>) {
  const update: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(body, "headline")) {
    update.headline = normalizeString(body.headline, 200);
  }

  if (Object.prototype.hasOwnProperty.call(body, "bio")) {
    update.bio = normalizeString(body.bio, MAX_BIO_LENGTH);
  }

  if (Object.prototype.hasOwnProperty.call(body, "subjects")) {
    update.subjects = normalizeStringArray(body.subjects);
  }

  if (Object.prototype.hasOwnProperty.call(body, "hourlyRate")) {
    const hourlyRate = Number(body.hourlyRate);
    update.hourlyRate = Number.isFinite(hourlyRate)
      ? Math.max(0, hourlyRate)
      : 0;
  }

  if (Object.prototype.hasOwnProperty.call(body, "certificates")) {
    update.certificates = normalizeCertificateArray(body.certificates);
  }

  if (Object.prototype.hasOwnProperty.call(body, "availability")) {
    const availability = normalizeMentorAvailability(body.availability);

    if (!availability) {
      return {
        error:
          "availability must be an array of { day, slots } with 1-hour slots like '09:00 AM - 10:00 AM'.",
      };
    }

    update.availability = availability;
  }

  if (body.submitForReview === true) {
    update.status = "pending";
    update.isPublic = false;
  }

  return { update };
}

function splitName(name?: string) {
  const [firstName = "", ...rest] = String(name ?? "").trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
  };
}

function serializeMentorProfile(profile: Record<string, any> | null) {
  if (!profile) {
    return emptyMentorProfile;
  }

  return {
    ...profile,
    availability: Array.isArray(profile.availability)
      ? profile.availability.map((item: Record<string, any>) => {
          const slots = Array.isArray(item.slots)
            ? item.slots
            : Array.isArray(item.timeSlots)
              ? item.timeSlots
              : [];

          return {
            day: item.day ?? "",
            slots,
            timeSlots: slots,
          };
        })
      : [],
    certificates: Array.isArray(profile.certificates)
      ? profile.certificates
      : [],
    status: profile.status ?? "pending",
    isPublic: Boolean(profile.isPublic && profile.status === "approved"),
  };
}

async function buildProfileResponse(userId: string) {
  const user = await User.findById(userId)
    .select("_id name email image role")
    .lean();

  if (!user) {
    return null;
  }

  const role = normalizeRole(user.role);
  const baseUser = {
    id: String(user._id),
    name: user.name ?? "",
    email: user.email ?? "",
    image: user.image ?? "",
    role,
    ...splitName(user.name),
  };

  if (role === "mentor") {
    const mentorProfile = await MentorProfile.findOne({ userId: user._id }).lean();
    const serializedMentorProfile = serializeMentorProfile(mentorProfile);

    return {
      user: baseUser,
      role,
      mentorProfile: serializedMentorProfile,
      profile: serializedMentorProfile,
    };
  }

  if (role === "student") {
    const studentProfile = await StudentProfile.findOne({ userId: user._id }).lean();

    return {
      user: baseUser,
      role,
      studentProfile: studentProfile ?? emptyStudentProfile,
      profile: studentProfile ?? emptyStudentProfile,
    };
  }

  return {
    user: baseUser,
    role,
    profile: null,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { message: "Valid user id is required." },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const profile = await buildProfileResponse(session.user.id);

    if (!profile) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json(
      { message: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json(
        { message: "Valid user id is required." },
        { status: 400 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    await connectMongoDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const role = normalizeRole(user.role);

    if (role !== "mentor" && hasAnyField(body, MENTOR_ONLY_FIELDS)) {
      return NextResponse.json(
        { message: "Forbidden. Mentor profile fields are only available to mentors." },
        { status: 403 }
      );
    }

    const nameUpdate = buildNameUpdate(body);
    if (nameUpdate) {
      user.name = nameUpdate;
    }

    if (Object.prototype.hasOwnProperty.call(body, "image")) {
      const newImageUrl = normalizeString(body.image, 1000);
      const cacheBustedUrl = newImageUrl
        ? newImageUrl.includes("?")
          ? `${newImageUrl}&v=${Date.now()}`
          : `${newImageUrl}?v=${Date.now()}`
        : "";

      user.image = cacheBustedUrl;
      await User.findByIdAndUpdate(user._id, { image: cacheBustedUrl });
    }

    await user.save();

    if (role === "mentor") {
      const mentorProfileResult = buildMentorProfileUpdate(body);

      if ("error" in mentorProfileResult) {
        return NextResponse.json(
          { message: mentorProfileResult.error },
          { status: 400 }
        );
      }

      if (Object.keys(mentorProfileResult.update).length > 0) {
        await MentorProfile.findOneAndUpdate(
          { userId: user._id },
          {
            $set: mentorProfileResult.update,
            $setOnInsert: {
              userId: user._id,
              status: "pending",
              isPublic: false,
            },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          }
        );
      }
    }

    if (role === "student") {
      const studentProfileUpdate = buildStudentProfileUpdate(body);

      await StudentProfile.findOneAndUpdate(
        { userId: user._id },
        { $set: studentProfileUpdate },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      if (
        Object.prototype.hasOwnProperty.call(
          studentProfileUpdate,
          "interestedSubjects"
        )
      ) {
        user.subjects = studentProfileUpdate.interestedSubjects;
        await user.save();
      }
    }

    const updatedProfile = await buildProfileResponse(session.user.id);

    return NextResponse.json({
      message: "Profile updated successfully.",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
