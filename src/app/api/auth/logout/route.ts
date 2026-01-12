import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json({ message: "Logged out" });
    
    // Burahin ang auth_token cookie
    response.cookies.set("auth_token", "", { 
        maxAge: 0,
        path: "/" 
    });
    
    return response;
}