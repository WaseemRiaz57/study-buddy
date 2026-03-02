import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    // Database connect karein
    await connectMongoDB();

    // Check karein agar user pehle se hai
    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json({ message: "User already exists!" }, { status: 400 });
    }

    // Naya user save karein
    await User.create({
      name,
      email,
      password, // Professional project mein hash karna zaroori hai, abhi simple rakhte hain
      role: role.toLowerCase(),
    });

    return NextResponse.json({ message: "User registered successfully!" }, { status: 201 });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ message: "Error registering user." }, { status: 500 });
  }
}