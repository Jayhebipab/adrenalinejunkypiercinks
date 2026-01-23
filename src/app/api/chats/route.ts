import { connectToDatabase } from "@/lib/mongodb";
import { NextResponse } from "next/server";

const WEBSITE_IDENTIFIER = "disruptivesolutionsinc";

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

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const mongoose = (global as any).mongoose.conn;
    const body = await req.json();

    // Dito ang fix par, dapat laging may website field pag nag-save
    const result = await mongoose.connection.db
      .collection("chats")
      .insertOne({
        ...body,
        website: WEBSITE_IDENTIFIER,
        timestamp: new Date()
      });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const mongoose = (global as any).mongoose.conn;
    
    // Kunin ang email mula sa query params: /api/chats?email=customer@client.com
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

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete thread" }, { status: 500 });
  }
}