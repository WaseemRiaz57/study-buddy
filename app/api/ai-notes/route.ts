import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import AINote from "@/models/AINote";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 6), 1), 20);

    await connectMongoDB();
    const notes = await AINote.find({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(notes);
  } catch {
    return NextResponse.json({ message: "Error fetching AI notes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { title, content, type } = await req.json();

    if (!title || !content || !type) {
      return NextResponse.json({ message: "title, content, and type are required" }, { status: 400 });
    }

    await connectMongoDB();

    const savedNote = await AINote.create({
      userId: session.user.email,
      title,
      content,
      type,
    });

    return NextResponse.json(savedNote, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Error saving AI note" }, { status: 500 });
  }
}