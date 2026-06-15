import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/supabase/middleware";
import { NextResponse } from "next/server";

export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAllowedAdmin(user)) return null;
  return user;
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  return user;
}
