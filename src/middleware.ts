import { NextResponse } from "next/server";
import { cookies } from 'next/headers'

export async function middleware(req: Request) {
  const cookieStore = await cookies()
  // Access the cookies
  const token = cookieStore.get("auth_token");

  if (!token) {
    // Redirect to login page if token is missing
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/chat"], // Add routes that require the token
};
