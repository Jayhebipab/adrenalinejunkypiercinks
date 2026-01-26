import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

async function getClient() {
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
}

// ---------- GET: FETCH ALL O FETCH ISA ----------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); // Kukuha ng id mula sa ?id=xxx

    const mongoClient = await getClient();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    if (id) {
      // Fetch Single Post
      const blog = await db.collection("blogs").findOne({ _id: new ObjectId(id) });
      if (!blog) return NextResponse.json({ error: "Post not found" }, { status: 404 });
      return NextResponse.json(blog);
    }

    // Fetch All Posts
    const blogs = await db.collection("blogs")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(blogs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ---------- POST: CREATE NEW ----------
export async function POST(req: Request) {
  try {
    const { title, image, category, content, link } = await req.json();
    const mongoClient = await getClient();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const result = await db.collection("blogs").insertOne({
      title,
      image,
      category,
      content,
      link, 
      createdAt: new Date()
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ---------- PUT: UPDATE EXISTING ----------
export async function PUT(req: Request) {
  try {
    const { _id, title, image, category, content, link } = await req.json();
    if (!_id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const mongoClient = await getClient();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const result = await db.collection("blogs").updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          title,
          image,
          category,
          content,
          link,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ---------- DELETE: REMOVE POST ----------
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const mongoClient = await getClient();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const result = await db.collection("blogs").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}