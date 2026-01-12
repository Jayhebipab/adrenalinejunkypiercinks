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

// --- GET: Para sa history ng delivery reports ---
export async function GET() {
  try {
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);
    const reports = await db.collection("delivery_reports").find({}).sort({ delivery_date: -1 }).toArray();
    return NextResponse.json(reports);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST: Para sa New Delivery (Assignment of Company & Multiple Products) ---
export async function POST(req: Request) {
  try {
    const { supplier, date, items } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);

    const operations = items.map((item: any) => ({
      updateOne: {
        filter: { _id: new ObjectId(item.productId) },
        update: {
          $set: { 
            selling_price: parseFloat(item.sellingPrice),
            supplier_name: supplier,
            last_delivery_date: new Date(date)
          },
          $inc: { quantity: parseInt(item.quantity) } 
        }
      }
    }));

    await db.collection("products").bulkWrite(operations);
    await db.collection("delivery_reports").insertOne({
      supplier,
      delivery_date: new Date(date),
      items: items.map((i: any) => ({
        productId: new ObjectId(i.productId),
        productName: i.productName,
        quantity: parseInt(i.quantity),
        sellingPrice: parseFloat(i.sellingPrice)
      })),
      createdAt: new Date()
    });

    return NextResponse.json({ message: "Stock Assigned!" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- PUT: ITO ANG NAWAWALA (Para sa Quick Update / Edit Button) ---
export async function PUT(req: Request) {
  try {
    const { id, quantity, sellingPrice } = await req.json();
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db(DB_NAME);

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          quantity: parseInt(quantity),
          selling_price: parseFloat(sellingPrice),
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Inventory Updated Successfully!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}