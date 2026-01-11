import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

// Helper function para sa Database Connection
async function getClient() {
  if (!uri) throw new Error("MONGODB_URI is not defined in .env.local");
  if (!client) {
    client = new MongoClient(uri);
  }
  return client;
}

// 1. GET: Kunin lahat ng products
export async function GET() {
  try {
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");
    
    // Naka-sort by name (A-Z) para malinis
    const products = await db.collection("products")
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Mag-add ng bagong product (with Image)
export async function POST(req: Request) {
  try {
    const { name, category, cost_price, image } = await req.json();
    
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const result = await db.collection("products").insertOne({
      name,
      category,
      cost_price: parseFloat(cost_price),
      image: image || null, // Base64 string mula sa frontend
      createdAt: new Date()
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// 3. PUT: Mag-update ng product (Pang-Edit)
export async function PUT(req: Request) {
  try {
    const { id, name, category, cost_price, image } = await req.json();
    
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const updateData: any = {
      name,
      category,
      cost_price: parseFloat(cost_price),
      updatedAt: new Date()
    };

    // I-update lang ang image kung may bagong in-upload
    if (image) {
      updateData.image = image;
    }

    await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return NextResponse.json({ message: "Product updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 4. DELETE: Magbura ng product
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const result = await db.collection("products").deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 1) {
      return NextResponse.json({ message: "Product deleted" });
    } else {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}