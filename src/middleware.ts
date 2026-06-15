import { NextResponse, type NextRequest } from "next/server";
import { athleteCookieOptions } from "@/lib/auth/athlete-cookie";
import { ATHLETE_COOKIE_NAME } from "@/lib/constants";
import { isAllowedAdmin, updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const athleteToken = request.cookies.get(ATHLETE_COOKIE_NAME)?.value;

  if (pathname === "/" && athleteToken) {
    return NextResponse.redirect(new URL(`/a/${athleteToken}`, request.url));
  }

  const athletePathMatch = pathname.match(/^\/a\/([^/]+)$/);
  if (athletePathMatch) {
    const token = athletePathMatch[1];
    const { response } = await updateSession(request);
    response.cookies.set(athleteCookieOptions(token));
    return response;
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLogin = pathname === "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin");
  const isAdminLoginApi =
    pathname === "/api/admin/login" || pathname === "/api/admin/logout";

  if (isAdminRoute || (isAdminApi && !isAdminLoginApi)) {
    const { response, user } = await updateSession(request);
    const isAdmin = isAllowedAdmin(user);

    if (isAdminRoute && !isAdminLogin && !isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (isAdminLogin && isAdmin) {
      return NextResponse.redirect(new URL("/admin/anuncios", request.url));
    }

    if (isAdminApi && !isAdminLoginApi && !isAdmin) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    return response;
  }

  const { response } = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
