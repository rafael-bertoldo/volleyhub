import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdmin } from "@/lib/supabase/middleware";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email?.trim() || !password) {
    return NextResponse.json(
      { error: "Informe e-mail e senha." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }

  if (!isAllowedAdmin(data.user)) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Este usuário não tem permissão de administrador." },
      { status: 403 },
    );
  }

  return NextResponse.json({ success: true });
}
