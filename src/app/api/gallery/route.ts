import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

async function getCollection() {
  await client.connect();
  // Ito ang database name at collection name mo
  const db = client.db("adrenalinjunkypiercinks");
  return db.collection("galleries");
}

export async function GET() {
  try {
    const collection = await getCollection();
    const photos = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(photos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image" }, { status: 400 });

    const collection = await getCollection();
    const result = await collection.insertOne({
      image,
      createdAt: new Date()
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}