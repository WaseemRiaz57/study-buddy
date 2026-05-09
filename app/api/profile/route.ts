import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";

const MAX_BIO_LENGTH = 500;
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

function splitName(name?: string) {
  const [firstName = "", ...rest] = String(name ?? "").trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
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

    return {
      user: baseUser,
      role,
      mentorProfile: mentorProfile ?? null,
      profile: mentorProfile ?? null,
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

    const nameUpdate = buildNameUpdate(body);
    if (nameUpdate) {
      user.name = nameUpdate;
    }

    if (Object.prototype.hasOwnProperty.call(body, "image")) {
      user.image = normalizeString(body.image, 1000);
    }

    await user.save();

    if (normalizeRole(user.role) === "student") {
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
