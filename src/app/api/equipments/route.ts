import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const DB = "adrenalinjunkypiercinks";
const COL = "chats";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB);
    
    // Kunin lahat ng messages, sorted by timestamp
    const data = await db.collection(COL)
      .find({})
      .sort({ timestamp: 1 })
      .toArray();
      
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db(DB);

    // Rekta insert, automatic timestamp
    const result = await db.collection(COL).insertOne({
      ...body,
      timestamp: new Date(),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB);

    // Burahin lahat ng messages ng client na ito
    await db.collection(COL).deleteMany({ senderEmail: email });

    return NextResponse.json({ message: "Conversation deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}