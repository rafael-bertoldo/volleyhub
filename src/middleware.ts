import { NextResponse, type NextRequest } from "next/server";
import { isAllowedAdmin, updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAthleteRoute = pathname === "/a" || pathname.startsWith("/a/");
  const isAthleteLogin = pathname === "/login";

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
      return NextResponse.redirect(new URL("/admin/announcements", request.url));
    }

    if (isAdminApi && !isAdminLoginApi && !isAdmin) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    return response;
  }

  if (isAthleteRoute) {
    const { response, user } = await updateSession(request);

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return response;
  }

  if (isAthleteLogin) {
    const { response } = await updateSession(request);
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
