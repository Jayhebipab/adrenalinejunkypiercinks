import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

async function getClient() {
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (!client) {
    client = new MongoClient(uri);
  }
  return client;
}

const DB_NAME = "adrenalinjunkypiercinks";
const COLLECTION_NAME = "suppliers";

// --- GET: Kunin lahat ng suppliers ---
export async function GET() {
  try {
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    
    // Naka-sort by createdAt para yung bago ang nasa taas
    const suppliers = await db.collection(COLLECTION_NAME)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
      
    return NextResponse.json(suppliers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST: Mag-add ng bagong supplier ---
export async function POST(req: Request) {
  try {
    const { name, company_name, address, contact } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);

    const result = await db.collection(COLLECTION_NAME).insertOne({
      name,
      company_name,
      address,
      contact,
      createdAt: new Date()
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- PUT: Mag-update ng existing supplier ---
export async function PUT(req: Request) {
  try {
    const { id, name, company_name, address, contact } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);

    const result = await db.collection(COLLECTION_NAME).updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          name, 
          company_name, 
          address, 
          contact,
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE: Magbura ng supplier ---
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);

    const result = await db.collection(COLLECTION_NAME).deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}