import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

async function getClient() {
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (!client) client = new MongoClient(uri);
  return client;
}

// GET: Kunin lahat ng tattoos
export async function GET() {
  try {
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");
    const tattoos = await db.collection("tattoos").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(tattoos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Mag-save ng bagong tattoo
export async function POST(req: Request) {
  try {
    const { image, placement, category } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const result = await db.collection("tattoos").insertOne({
      image,
      placement,
      category,
      createdAt: new Date()
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Magbura ng tattoo gamit ang ID
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    await db.collection("tattoos").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}