"use client";

import {
  Users,
  UserCheck,
  DollarSign,
  Radio,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Metric card data                                                   */
/* ------------------------------------------------------------------ */
interface MetricCard {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  highlight?: boolean;
  highlightColor?: string;
}

const metrics: MetricCard[] = [
  {
    label: "Total Active Users",
    value: "1,245",
    change: "+12.5%",
    trend: "up",
    icon: Users,
  },
  {
    label: "Pending Mentors",
    value: "12",
    change: "+3 this week",
    trend: "up",
    icon: UserCheck,
    highlight: true,
    highlightColor: "orange",
  },
  {
    label: "Total Revenue",
    value: "$4,500",
    change: "+8.2%",
    trend: "up",
    icon: DollarSign,
  },
  {
    label: "Active Sessions",
    value: "84",
    change: "-2.1%",
    trend: "down",
    icon: Radio,
  },
];

/* ------------------------------------------------------------------ */
/* Admin Overview Page                                                */
/* ------------------------------------------------------------------ */
export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white">
          Admin Command Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform overview and key metrics
        </p>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {metrics.map((m) => {
          const isOrange = m.highlight && m.highlightColor === "orange";

          return (
            <div
              key={m.label}
              className={`
                relative rounded-2xl border p-5 transition-all duration-200
                ${
                  isOrange
                    ? "border-orange-300 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/[0.06]"
                    : "border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.03]"
                }
                hover:shadow-lg dark:hover:shadow-purple-500/5
              `}
            >
              {/* Icon */}
              <div
                className={`
                  inline-flex items-center justify-center w-10 h-10 rounded-xl mb-4
                  ${
                    isOrange
                      ? "bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400"
                      : "bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400"
                  }
                `}
              >
                <m.icon size={20} />
              </div>

              {/* Value */}
              <p className="text-2xl font-bold text-foreground dark:text-white">
                {m.value}
              </p>

              {/* Label */}
              <p className="text-sm text-muted-foreground mt-0.5">{m.label}</p>

              {/* Trend */}
              <div className="flex items-center gap-1 mt-3">
                {m.trend === "up" ? (
                  <ArrowUpRight size={14} className="text-emerald-500" />
                ) : (
                  <ArrowDownRight size={14} className="text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${
                    m.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {m.change}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  vs last month
                </span>
              </div>

              {/* Pending badge for highlighted card */}
              {isOrange && (
                <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-500 text-white">
                  Action Needed
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Charts Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Revenue Growth (large) */}
        <div className="lg:col-span-2 rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp
                size={18}
                className="text-purple-600 dark:text-purple-400"
              />
              <h2 className="text-lg font-semibold text-foreground dark:text-white">
                Revenue Growth
              </h2>
            </div>
            <select className="text-xs px-3 py-1.5 rounded-lg border border-border dark:border-white/10 bg-transparent text-muted-foreground dark:text-slate-400 focus:outline-none">
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>This year</option>
            </select>
          </div>

          {/* Placeholder chart area */}
          <div className="flex items-center justify-center h-64 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/[0.06]">
            <div className="text-center">
              <TrendingUp
                size={40}
                className="mx-auto text-slate-300 dark:text-slate-600 mb-3"
              />
              <p className="text-sm font-medium text-muted-foreground">
                Revenue chart will render here
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Integrate with your preferred charting library
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity (smaller) */}
        <div className="rounded-2xl border border-border dark:border-white/[0.06] bg-white dark:bg-white/[0.03] p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity
              size={18}
              className="text-purple-600 dark:text-purple-400"
            />
            <h2 className="text-lg font-semibold text-foreground dark:text-white">
              Recent Activity
            </h2>
          </div>

          {/* Placeholder activity feed */}
          <div className="space-y-4">
            {[
              {
                text: "New mentor application received",
                time: "2 min ago",
                dot: "bg-orange-500",
              },
              {
                text: "User report flagged for review",
                time: "15 min ago",
                dot: "bg-red-500",
              },
              {
                text: "Pro subscription purchased",
                time: "1 hr ago",
                dot: "bg-emerald-500",
              },
              {
                text: "New study room created",
                time: "2 hrs ago",
                dot: "bg-blue-500",
              },
              {
                text: "Mentor approved: Jane D.",
                time: "3 hrs ago",
                dot: "bg-purple-500",
              },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-start gap-3 group"
              >
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${activity.dot}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground dark:text-slate-200 truncate">
                    {activity.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* View all link */}
          <button className="mt-5 w-full text-center text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors">
            View all activity →
          </button>
        </div>
      </div>
    </div>
  );
}
