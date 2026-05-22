import Skeleton from "@/components/ui/Skeleton";

function ResourceCardSkeleton() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex items-start justify-between">
        <Skeleton className="h-14 w-14 rounded-xl" />
        <Skeleton className="h-7 w-16 rounded-lg" />
      </div>

      <div className="mb-4 space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>

      <Skeleton className="mt-4 h-10 w-full rounded-xl" />
    </article>
  );
}

export default function ResourceHubLoading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-[#0f0c13] md:p-8">
      <span className="sr-only">Loading resources</span>

      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-10 w-56 rounded-xl md:h-11 md:w-64" />
        </div>

        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>

      <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-white/5 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 px-3">
          <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <Skeleton className="mb-4 h-4 w-36" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <ResourceCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
