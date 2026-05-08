import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile, {
  type IMentorAvailability,
} from "@/models/MentorProfile";
import User from "@/models/User";

type MentorUser = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  image?: string;
};

type MentorProfileData = {
  userId: mongoose.Types.ObjectId;
  subjects?: string[];
  hourlyRate?: number;
  rating?: number;
  bio?: string;
  availability?: IMentorAvailability[];
};

export async function GET() {
  try {
    await connectMongoDB();

    const mentorUsers = (await User.find({ role: "mentor" })
      .select("_id name email image")
      .sort({ name: 1 })
      .lean()) as MentorUser[];

    const mentorIds = mentorUsers.map((mentor) => mentor._id);
    const mentorProfiles = (await MentorProfile.find({
      userId: { $in: mentorIds },
    }).lean()) as MentorProfileData[];

    const profilesByUserId = new Map(
      mentorProfiles.map((profile) => [String(profile.userId), profile])
    );

    const mentors = mentorUsers.map((mentor) => {
      const profile = profilesByUserId.get(String(mentor._id));

      return {
        id: String(mentor._id),
        name: mentor.name ?? "",
        email: mentor.email ?? "",
        image: mentor.image ?? "",
        subjects: profile?.subjects ?? [],
        hourlyRate: profile?.hourlyRate ?? 0,
        rating: profile?.rating ?? 0,
        bio: profile?.bio ?? "",
        availability: profile?.availability ?? [],
      };
    });

    return NextResponse.json(mentors);
  } catch (error) {
    console.error("Fetch mentors error:", error);
    return NextResponse.json(
      { message: "Failed to fetch mentors" },
      { status: 500 }
    );
  }
}
