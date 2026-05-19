import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import FocusSession from "@/models/FocusSession";

export const dynamic = "force-dynamic";

const DAYS = [
  { key: 2, day: "M", label: "Monday" },
  { key: 3, day: "T", label: "Tuesday" },
  { key: 4, day: "W", label: "Wednesday" },
  { key: 5, day: "T", label: "Thursday" },
  { key: 6, day: "F", label: "Friday" },
  { key: 7, day: "S", label: "Saturday" },
  { key: 1, day: "S", label: "Sunday" },
];

function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !mongoose.Types.ObjectId.isValid(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const groupedSessions = await FocusSession.aggregate<{
      _id: number;
      minutes: number;
    }>([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(session.user.id),
          completedAt: { $gte: weekStart, $lt: weekEnd },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$completedAt" },
          minutes: { $sum: "$minutes" },
        },
      },
    ]);

    const minutesByDay = new Map(
      groupedSessions.map((entry) => [Number(entry._id), Number(entry.minutes || 0)])
    );
    const maxMinutes = Math.max(
      1,
      ...DAYS.map((day) => minutesByDay.get(day.key) || 0)
    );
    const data = DAYS.map((day) => {
      const minutes = minutesByDay.get(day.key) || 0;

      return {
        day: day.day,
        label: day.label,
        minutes,
        hours: Math.round((minutes / 60) * 10) / 10,
        pct: Math.round((minutes / maxMinutes) * 100),
      };
    });

    return NextResponse.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalMinutes: data.reduce((total, day) => total + day.minutes, 0),
      data,
    });
  } catch (error) {
    console.error("Focus stats error:", error);
    return NextResponse.json(
      { message: "Failed to load focus stats." },
      { status: 500 }
    );
  }
}
