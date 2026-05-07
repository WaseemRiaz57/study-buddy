// app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectMongoDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import mongoose from "mongoose";

const priorities = new Set(["High", "Med", "Low"]);

// 1. Tasks GET karna (Fetch)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectMongoDB();
    // Sirf login wale user ke tasks nikal kar laao
    const tasks = await Task.find({ userId: session.user.email }).sort({ createdAt: 1 });
    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ message: "Error fetching tasks" }, { status: 500 });
  }
}

// 2. Naya Task POST karna (Add)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { text, priority } = await req.json();
    const taskText = String(text || "").trim();
    const normalizedPriority = priorities.has(priority) ? priority : "Med";

    if (!taskText || taskText.length > 500) {
      return NextResponse.json(
        { message: "Task text must be between 1 and 500 characters." },
        { status: 400 }
      );
    }

    await connectMongoDB();
    
    const newTask = await Task.create({
      userId: session.user.email,
      text: taskText,
      priority: normalizedPriority,
      done: false
    });
    
    return NextResponse.json(newTask, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Error creating task" }, { status: 500 });
  }
}

// 3. Task Update karna (Tick / Untick)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id, done } = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id) || typeof done !== "boolean") {
      return NextResponse.json({ message: "Valid id and done boolean are required" }, { status: 400 });
    }

    await connectMongoDB();
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, userId: session.user.email },
      { done },
      { new: true }
    );

    if (!updatedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTask);
  } catch {
    return NextResponse.json({ message: "Error updating task" }, { status: 500 });
  }
}

// 4. Task Delete karna (Remove)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!mongoose.Types.ObjectId.isValid(id || "")) {
      return NextResponse.json({ message: "Valid id is required" }, { status: 400 });
    }
    
    await connectMongoDB();
    const deletedTask = await Task.findOneAndDelete({ _id: id, userId: session.user.email });

    if (!deletedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch {
    return NextResponse.json({ message: "Error deleting task" }, { status: 500 });
  }
}
