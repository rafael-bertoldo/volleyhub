import { NextResponse, type NextRequest } from "next/server";
import { ATHLETE_COOKIE_NAME } from "@/lib/constants";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const athleteToken = request.cookies.get(ATHLETE_COOKIE_NAME)?.value;

  if (pathname === "/" && athleteToken) {
    return NextResponse.redirect(new URL(`/a/${athleteToken}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
