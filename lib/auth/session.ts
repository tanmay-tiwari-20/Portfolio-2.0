import { SignJWT } from "jose";import { cookies } from "next/headers";import {verifyToken} from "@/lib/auth/token";export {verifyToken};const cookieName="spider-session";const secret=()=>new TextEncoder().encode(process.env.SESSION_SECRET||"");
export async function createSession(email:string){if(!process.env.SESSION_SECRET||process.env.SESSION_SECRET.length<32)throw new Error("SESSION_SECRET must be at least 32 characters");const token=await new SignJWT({email}).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("8h").sign(secret());(await cookies()).set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:28800});}
export async function currentAdmin(){return verifyToken((await cookies()).get(cookieName)?.value)}
export async function clearSession(){(await cookies()).delete(cookieName)}
export const sessionCookieName=cookieName;
