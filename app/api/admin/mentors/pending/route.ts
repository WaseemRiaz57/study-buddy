import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import MentorProfile from "@/models/MentorProfile";

type PopulatedApplicant = {
  _id?: unknown;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type PendingMentorProfile = {
  _id: unknown;
  userId?: PopulatedApplicant | null;
  headline?: string;
  bio?: string;
  subjects?: string[];
  hourlyRate?: number;
  certificates?: string[];
  availability?: unknown[];
  createdAt?: Date | string;
};

function isAdminRole(role: unknown) {
  return String(role ?? "").toLowerCase() === "admin";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminRole(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectMongoDB();

    const pendingProfiles = (await MentorProfile.find({ status: "pending" })
      .populate({ path: "userId", select: "name email image" })
      .sort({ createdAt: -1 })
      .lean()) as PendingMentorProfile[];

    const applications = pendingProfiles.map((profile) => {
      const applicant = profile.userId ?? {};

      return {
        id: String(profile._id),
        applicant: {
          id: String(applicant._id ?? ""),
          name: applicant.name ?? "Unknown applicant",
          email: applicant.email ?? "",
          image: applicant.image ?? "",
        },
        headline: profile.headline ?? "",
        bio: profile.bio ?? "",
        subjects: Array.isArray(profile.subjects) ? profile.subjects : [],
        hourlyRate: Number(profile.hourlyRate ?? 0),
        certificates: Array.isArray(profile.certificates)
          ? profile.certificates
          : [],
        availability: Array.isArray(profile.availability)
          ? profile.availability
          : [],
        createdAt: profile.createdAt ?? null,
      };
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Fetch pending mentor applications error:", error);
    return NextResponse.json(
      { message: "Failed to fetch pending mentor applications." },
      { status: 500 }
    );
  }
}
