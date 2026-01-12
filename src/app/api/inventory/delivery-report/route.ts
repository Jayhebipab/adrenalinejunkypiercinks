import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

async function getClient() {
  if (!uri) throw new Error("MONGODB_URI is not defined");
  if (!client) client = new MongoClient(uri);
  return client;
}

export async function POST(req: Request) {
  try {
    const { dr_number, supplier_id, date_delivered, items } = await req.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid items list" }, { status: 400 });
    }

    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    // Gagamit tayo ng Bulk Operations para mabilis at sabay-sabay ang update
    const operations = items.map((item) => ({
      updateOne: {
        filter: { _id: new ObjectId(item.product_id) },
        update: {
          $inc: { quantity: item.quantity }, // Dagdag sa kasalukuyang stock
          $set: { 
            selling_price: parseFloat(item.selling_price),
            last_dr: dr_number,
            updatedAt: new Date()
          }
        }
      }
    }));

    // Isang tawag lang sa DB para sa lahat ng items
    const result = await db.collection("inventory").bulkWrite(operations);

    // OPTIONAL: I-save ang transaction record para sa history
    await db.collection("delivery_logs").insertOne({
      dr_number,
      supplier_id,
      date_delivered,
      items_count: items.length,
      createdAt: new Date()
    });

    return NextResponse.json({ 
      message: "Stock updated successfully", 
      modifiedCount: result.modifiedCount 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}