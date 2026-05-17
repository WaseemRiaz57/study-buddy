import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Comment from "@/models/Comment";
import CommunityPost from "@/models/CommunityPost";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectMongoDB();

    const since24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalMembers, activePosts, activeNow, postsThisWeek, topContributors, popularTags] =
      await Promise.all([
        User.countDocuments({ role: { $in: ["student", "mentor"] } }),
        CommunityPost.countDocuments({}),
        User.countDocuments({ lastActive: { $gte: since24Hours } }),
        CommunityPost.countDocuments({ createdAt: { $gte: since7Days } }),
        CommunityPost.aggregate([
          { $group: { _id: "$authorId", posts: { $sum: 1 } } },
          { $sort: { posts: -1 } },
          { $limit: 3 },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "author",
            },
          },
          { $unwind: "$author" },
          {
            $project: {
              posts: 1,
              name: "$author.name",
              image: { $ifNull: ["$author.profileImage", "$author.image"] },
              role: "$author.role",
            },
          },
        ]),
        CommunityPost.aggregate([
          { $unwind: "$tags" },
          { $group: { _id: "$tags", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
      ]);

    const totalComments = await Comment.countDocuments({});

    return NextResponse.json({
      stats: {
        totalMembers,
        activePosts,
        activeNow,
        postsThisWeek,
        totalComments,
      },
      topContributors: topContributors.map((contributor) => ({
        id: String(contributor._id),
        name: contributor.name || "Scholar",
        image: contributor.image || "",
        role: contributor.role || "student",
        posts: contributor.posts || 0,
      })),
      popularTags: popularTags.map((tag) => ({
        tag: String(tag._id || ""),
        count: tag.count || 0,
      })),
    });
  } catch (error) {
    console.error("Fetch community stats error:", error);
    return NextResponse.json(
      { message: "Failed to fetch community stats." },
      { status: 500 }
    );
  }
}


