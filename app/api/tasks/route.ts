// app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectMongoDB } from "@/lib/mongodb";
import Task from "@/models/Task";

// 1. Tasks GET karna (Fetch)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectMongoDB();
    // Sirf login wale user ke tasks nikal kar laao
    const tasks = await Task.find({ userId: session.user.email }).sort({ createdAt: 1 });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching tasks" }, { status: 500 });
  }
}

// 2. Naya Task POST karna (Add)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { text, priority } = await req.json();
    await connectMongoDB();
    
    const newTask = await Task.create({
      userId: session.user.email,
      text,
      priority,
      done: false
    });
    
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error creating task" }, { status: 500 });
  }
}

// 3. Task Update karna (Tick / Untick)
export async function PATCH(req: Request) {
  try {
    const { id, done } = await req.json();
    await connectMongoDB();
    const updatedTask = await Task.findByIdAndUpdate(id, { done }, { new: true });
    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json({ message: "Error updating task" }, { status: 500 });
  }
}

// 4. Task Delete karna (Remove)
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    await connectMongoDB();
    await Task.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting task" }, { status: 500 });
  }
}