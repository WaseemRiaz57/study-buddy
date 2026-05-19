import { redirect } from "next/navigation";

export default async function MessageUserPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  redirect(`/dashboard/messages?user=${encodeURIComponent(userId)}`);
}
