import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

async function getClient() {
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (!client) client = new MongoClient(uri);
  return client;
}

// GET: Kunin lahat ng reviews para ipakita sa site
export async function GET() {
  try {
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");
    const reviews = await db.collection("reviews").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(reviews);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Dito papasok yung review galing sa User Panel
export async function POST(req: Request) {
  try {
    const { name, stars, description, userEmail, userImage } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const result = await db.collection("reviews").insertOne({
      name,
      stars: Number(stars),
      description,
      userEmail,
      userImage,
      createdAt: new Date()
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Idagdag itong PUT at DELETE sa existing route.ts mo

// UPDATE: Para sa Hide/Show (Toggle Status)
export async function PUT(req: Request) {
  try {
    const { id, isVisible } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    await db.collection("reviews").updateOne(
      { _id: new ObjectId(id) },
      { $set: { isVisible: isVisible } }
    );

    return NextResponse.json({ message: "Review status updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Para tuluyang burahin ang review
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    await db.collection("reviews").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ message: "Review deleted permanently" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}