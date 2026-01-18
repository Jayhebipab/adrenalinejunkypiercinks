import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

async function getClient() {
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (!client) client = new MongoClient(uri);
  return client;
}

// GET: Kunin lahat ng VAT records
export async function GET() {
  try {
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");
    const vats = await db.collection("vats").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(vats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Mag-add ng bagong VAT record
export async function POST(req: Request) {
  try {
    const { vat_name, percentage } = await req.json();
    
    // Server-side validation: Bawal ang 0 or less, bawal ang lampas 99
    if (percentage < 1 || percentage > 99) {
      return NextResponse.json({ error: "Percentage must be between 1 and 99" }, { status: 400 });
    }

    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const result = await db.collection("vats").insertOne({
      vat_name,
      percentage: Number(percentage),
      createdAt: new Date()
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Mag-update ng existing VAT
export async function PUT(req: Request) {
  try {
    const { id, vat_name, percentage } = await req.json();

    // Server-side validation
    if (percentage < 1 || percentage > 99) {
      return NextResponse.json({ error: "Percentage must be between 1 and 99" }, { status: 400 });
    }

    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    await db.collection("vats").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          vat_name, 
          percentage: Number(percentage),
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({ message: "VAT Updated" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Magbura ng VAT record
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    await db.collection("vats").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ message: "VAT Deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}