import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

const WEBSITE_IDENTIFIER = "disruptivesolutionsinc";

// --- FETCH CHATS ---
export async function GET() {
  try {
    await connectToDatabase();
    const mongoose = (global as any).mongoose.conn;
    
    const chats = await mongoose.connection.db
      .collection("chats")
      .find({ website: WEBSITE_IDENTIFIER })
      .sort({ timestamp: 1 })
      .toArray();

    return NextResponse.json(chats);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}

// --- SEND MESSAGE (WITH IMAGE TYPE SUPPORT) ---
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const mongoose = (global as any).mongoose.conn;
    const body = await req.json();

    const { senderEmail, senderName, message, isAdmin, type } = body;

    // Validation: Siguraduhin na hindi empty ang message
    if (!message || !senderEmail) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await mongoose.connection.db
      .collection("chats")
      .insertOne({
        senderEmail,
        senderName,
        message, // Dito mapupunta ang text string o Base64 image string
        isAdmin: isAdmin || false,
        type: type || "text", // Default sa 'text' kung walang pinasa
        website: WEBSITE_IDENTIFIER,
        timestamp: new Date()
      });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// --- DELETE THREAD ---
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const mongoose = (global as any).mongoose.conn;
    
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const result = await mongoose.connection.db
      .collection("chats")
      .deleteMany({ 
        senderEmail: email,
        website: WEBSITE_IDENTIFIER 
      });

    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete thread" }, { status: 500 });
  }
}