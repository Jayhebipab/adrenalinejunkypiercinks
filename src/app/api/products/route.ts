import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const uri = process.env.MONGODB_URI;
let client: MongoClient | null = null;

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
    
    const products = await db.collection("products")
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. POST: Mag-add ng bagong product
export async function POST(req: Request) {
  try {
    // FIX: Idinagdag ang description sa destructuring
    const { name, category, cost_price, image, description } = await req.json();
    
    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    const result = await db.collection("products").insertOne({
      name,
      category,
      cost_price: parseFloat(cost_price),
      image: image || null,
      description: description || "", // FIX: Gamitin ang variable mula sa body
      createdAt: new Date(),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}// route.ts
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...fieldsToUpdate } = body; 
    
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const mongoClient = await getClient();
    await mongoClient.connect();
    const db = mongoClient.db("adrenalinjunkypiercinks");

    // Dito natin ilalagay lang ang mga fields na may "valid" na data
    const updateData: any = {
      updatedAt: new Date()
    };

    // Tsetsek natin isa-isa: Kung may laman, isama sa update. Kung wala, pabayaan.
    if (fieldsToUpdate.name) updateData.name = fieldsToUpdate.name;
    if (fieldsToUpdate.category) updateData.category = fieldsToUpdate.category;
    if (fieldsToUpdate.image) updateData.image = fieldsToUpdate.image;
    if (fieldsToUpdate.description !== undefined) updateData.description = fieldsToUpdate.description;
    if (fieldsToUpdate.isVisible !== undefined) updateData.isVisible = fieldsToUpdate.isVisible;
    
    // Numbers: Siguraduhing valid number bago i-save
    if (fieldsToUpdate.quantity !== undefined && fieldsToUpdate.quantity !== "") {
        updateData.quantity = parseInt(fieldsToUpdate.quantity);
    }
    if (fieldsToUpdate.sellingPrice !== undefined && fieldsToUpdate.sellingPrice !== "") {
        updateData.selling_price = parseFloat(fieldsToUpdate.sellingPrice);
    }
    if (fieldsToUpdate.cost_price !== undefined && fieldsToUpdate.cost_price !== "") {
        updateData.cost_price = parseFloat(fieldsToUpdate.cost_price);
    }

    await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData } // $set ang susi para hindi mabura ang ibang fields
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

    return NextResponse.json({ message: "Product deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}