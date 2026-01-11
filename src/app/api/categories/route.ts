import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

async function getClient() {
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (!client) client = new MongoClient(uri);
  return client;
}

// GET: Kunin lahat ng categories
export async function GET() {
  try {
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");
    const categories = await db.collection("categories").find({}).toArray();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Mag-add ng bagong category
export async function POST(req: Request) {
  try {
    const { category_name } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const result = await db.collection("categories").insertOne({
      category_name,
      createdAt: new Date()
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Mag-update ng existing category
export async function PUT(req: Request) {
  try {
    const { id, category_name } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    await db.collection("categories").updateOne(
      { _id: new ObjectId(id) },
      { $set: { category_name } }
    );

    return NextResponse.json({ message: "Updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Magbura ng category
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    await db.collection("categories").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ message: "Deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}