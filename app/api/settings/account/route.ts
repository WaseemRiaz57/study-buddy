import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import AINote from "@/models/AINote";
import Otp from "@/models/Otp";
import StudentProfile from "@/models/StudentProfile";
import StudyProfile from "@/models/StudyProfile";
import Task from "@/models/Task";
import User from "@/models/User";
import UserProgress from "@/models/UserProgress";

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const user = await User.findById(session.user.id).select("_id email");
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const userId = String(user._id);
    const email = String(user.email || "").toLowerCase();

    await Promise.all([
      StudentProfile.deleteOne({ userId: user._id }),
      Otp.deleteMany({ email }),
      AINote.deleteMany({ userId: { $in: [email, userId] } }),
      Task.deleteMany({ userId: { $in: [email, userId] } }),
      StudyProfile.deleteMany({ userId: { $in: [email, userId] } }),
      UserProgress.deleteMany({ userId: { $in: [email, userId] } }),
    ]);

    await User.deleteOne({ _id: user._id });

    return NextResponse.json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { message: "Failed to delete account." },
      { status: 500 }
    );
  }
}


