import { redirect } from "next/navigation";

export default async function CommunityPostAliasPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  redirect(`/dashboard/community/${postId}`);
}
