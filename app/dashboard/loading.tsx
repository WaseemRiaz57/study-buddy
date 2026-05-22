import Skeleton from "@/components/ui/Skeleton";

function QuestSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <Skeleton className="mt-3 h-2 w-full rounded-full" />
    </div>
  );
}

function NoteCardSkeleton() {
  return (
    <div className="glass-panel min-w-[260px] rounded-[1.5rem] p-5">
      <Skeleton className="mb-4 aspect-[4/3] w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

function SessionSkeleton() {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="mt-5 flex justify-end border-t border-border/60 pt-4">
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background p-6">
      <span className="sr-only">Loading dashboard</span>
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="glass-panel relative overflow-hidden rounded-[2rem] p-8 md:col-span-2">
            <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
              <div className="flex-1 space-y-4">
                <Skeleton className="h-7 w-40 rounded-full" />
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full max-w-md rounded-xl" />
                  <Skeleton className="h-10 w-2/3 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full max-w-lg" />
                  <Skeleton className="h-4 w-4/5 max-w-md" />
                </div>
                <Skeleton className="h-12 w-48 rounded-xl" />
              </div>
              <Skeleton className="h-40 w-40 shrink-0 rounded-full" />
            </div>
          </div>

          <div className="glass-panel flex flex-col justify-between rounded-[2rem] p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-6 w-3/5" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-8 w-44" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <QuestSkeleton key={index} />
              ))}
            </div>
          </div>

          <div className="space-y-6 xl:col-span-2">
            <div className="glass-panel rounded-2xl p-4">
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="-mx-4 flex gap-4 overflow-hidden px-4 pb-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <NoteCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <SessionSkeleton key={index} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
