import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

// Kunin ang URI mula sa .env
const uri = process.env.MONGODB_URI;

// Gumawa ng variable para sa client pero huwag muna i-initialize
let client: MongoClient | null = null;

async function getClient() {
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  if (!client) {
    client = new MongoClient(uri);
  }
  return client;
}

export async function GET() {
  try {
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");
    const photos = await db.collection("gallery").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(photos);
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");
    const result = await db.collection("gallery").insertOne({
      image,
      createdAt: new Date()
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}