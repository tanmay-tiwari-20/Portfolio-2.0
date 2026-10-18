import { NextRequest,NextResponse } from "next/server";import {verifyToken} from "@/lib/auth/token";
export async function proxy(req:NextRequest){const path=req.nextUrl.pathname;const user=await verifyToken(req.cookies.get("spider-session")?.value);if(path.startsWith("/secret-admin")&&!path.startsWith("/secret-admin/login")&&!user)return NextResponse.redirect(new URL("/secret-admin/login",req.url));if(path.startsWith("/api/admin/")&&!path.startsWith("/api/admin/login")&&!user)return NextResponse.json({error:"Unauthorized"},{status:401});return NextResponse.next()}
export const config={matcher:["/secret-admin/:path*","/api/admin/:path*"]};

