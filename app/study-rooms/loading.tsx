import Skeleton from "@/components/ui/Skeleton";

function RoomCardSkeleton() {
  return (
    <article className="flex h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-7 w-24 rounded-md" />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
        <div className="flex min-w-0 flex-1 items-center gap-2 pr-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-4 w-12" />
      </div>
    </article>
  );
}

export default function StudyRoomsLoading() {
  return (
    <main className="relative z-10 min-h-screen flex-1 bg-slate-50 px-4 py-8 pb-20 text-slate-900 transition-colors duration-300 dark:bg-[#0f0c13] dark:text-white md:px-8">
      <span className="sr-only">Loading study rooms</span>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-3">
            <Skeleton className="h-12 w-72 rounded-xl md:h-14 md:w-96" />
            <Skeleton className="h-6 w-64 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>

        <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-12 w-36 rounded-xl" />
            <Skeleton className="h-12 w-20 rounded-xl" />
            <Skeleton className="h-12 w-28 rounded-xl" />
            <Skeleton className="h-12 w-32 rounded-xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <RoomCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
