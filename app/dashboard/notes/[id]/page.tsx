import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import ReactMarkdown from "react-markdown";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import AIContent from "@/models/AIContent";
import BackButton from "@/components/ui/BackButton";

export const dynamic = "force-dynamic";

export default async function DashboardNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  await connectMongoDB();

  const note = await AIContent.findOne({
    _id: id,
    userId: session.user.id,
  })
    .select("prompt generatedText type createdAt")
    .lean();

  if (!note) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl">
        <header className="mb-8">
          <BackButton
            href="/dashboard"
            label="Back to dashboard"
            className="mb-5 border border-border"
          />
          <p className="mb-3 inline-flex rounded-full bg-[#7C3AED]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
            {note.type === "summarizer" ? "Summary" : "Notes"}
          </p>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">
            {String(note.prompt || "AI Note").slice(0, 160)}
          </h1>
        </header>

        <section className="glass-panel rounded-3xl p-5 md:p-8">
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground">
            <ReactMarkdown>{String(note.generatedText || "")}</ReactMarkdown>
          </div>
        </section>
      </article>
    </main>
  );
}
