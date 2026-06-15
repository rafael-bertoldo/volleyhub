import { cookies } from "next/headers";
import { ATHLETE_COOKIE_NAME, COOKIE_MAX_AGE_SECONDS } from "@/lib/constants";

export async function getAthleteTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ATHLETE_COOKIE_NAME)?.value ?? null;
}

export async function setAthleteCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ATHLETE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function athleteCookieOptions(token: string) {
  return {
    name: ATHLETE_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  };
}
