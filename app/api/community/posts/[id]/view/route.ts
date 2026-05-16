import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongoDB } from "@/lib/mongodb";
import CommunityPost from "@/models/CommunityPost";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid post id." }, { status: 400 });
    }

    const cookieName = `community_view_${id}`;
    const alreadyViewed = request.headers.get("cookie")?.includes(`${cookieName}=1`);

    await connectMongoDB();

    const post = alreadyViewed
      ? await CommunityPost.findById(id).select("views").lean()
      : await CommunityPost.findByIdAndUpdate(
          id,
          { $inc: { views: 1 } },
          { new: true }
        ).select("views");

    if (!post) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    const response = NextResponse.json({
      views: Number(post.views || 0),
      counted: !alreadyViewed,
    });

    if (!alreadyViewed) {
      response.cookies.set(cookieName, "1", {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 10,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Increment community post view error:", error);
    return NextResponse.json(
      { message: "Failed to update post view." },
      { status: 500 }
    );
  }
}
