import { NextResponse } from "next/server";

export function middleware(req) {
  const admin = req.cookies.get("admin");

  if (!admin && req.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};