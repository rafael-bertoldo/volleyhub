import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: "E-mail ou senha incorretos." },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  const { data: player } = await admin
    .from("players")
    .select("id")
    .eq("auth_user_id", data.user.id)
    .eq("active", true)
    .single();

  if (!player) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Este usuário não possui cadastro de atleta ativo." },
      { status: 403 },
    );
  }

  return NextResponse.json({ success: true });
}
