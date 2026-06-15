import { NextResponse, type NextRequest } from "next/server";
import { athleteCookieOptions } from "@/lib/auth/athlete-cookie";
import { ATHLETE_COOKIE_NAME } from "@/lib/constants";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const athleteToken = request.cookies.get(ATHLETE_COOKIE_NAME)?.value;

  if (pathname === "/" && athleteToken) {
    return NextResponse.redirect(new URL(`/a/${athleteToken}`, request.url));
  }

  const athletePathMatch = pathname.match(/^\/a\/([^/]+)$/);
  if (athletePathMatch) {
    const token = athletePathMatch[1];
    const response = await updateSession(request);
    response.cookies.set(athleteCookieOptions(token));
    return response;
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
