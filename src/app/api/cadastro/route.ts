import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MEMBERSHIP_TYPES, POSITIONS } from "@/lib/constants";
import type { SignupFormData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignupFormData & {
      email?: string;
      password?: string;
      convite_token?: string;
    };

    const {
      convite_token,
      email,
      password,
      name,
      nickname,
      birth_date,
      address,
      city_area,
      preferred_position,
      membership_type,
      competition_interest,
      notes,
    } = body;

    if (
      !email?.trim() ||
      !password ||
      !name?.trim() ||
      !birth_date ||
      !address?.trim() ||
      !city_area?.trim() ||
      !preferred_position ||
      !membership_type ||
      !competition_interest
    ) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres." },
        { status: 400 },
      );
    }

    const membership_typeInfo = MEMBERSHIP_TYPES.find((m) => m.value === membership_type);
    if (!membership_typeInfo) {
      return NextResponse.json({ error: "Modalidade inválida." }, { status: 400 });
    }

    const preferred_positionInfo = POSITIONS.find((p) => p.value === preferred_position);
    if (!preferred_positionInfo) {
      return NextResponse.json({ error: "Posição inválida." }, { status: 400 });
    }

    const supabase = createAdminClient();

    let convite: { id: string } | null = null;

    if (convite_token) {
      const { data: inviteLink, error: conviteError } = await supabase
        .from("invite_links")
        .select("*")
        .eq("token", convite_token)
        .single();

      if (conviteError || !inviteLink) {
        return NextResponse.json(
          { error: "Link de cadastro inválido." },
          { status: 404 },
        );
      }

      if (inviteLink.used) {
        return NextResponse.json(
          { error: "Este link de cadastro já foi utilizado." },
          { status: 400 },
        );
      }

      if (inviteLink.expires_at && new Date(inviteLink.expires_at) < new Date()) {
        return NextResponse.json(
          { error: "Este link de cadastro expirou." },
          { status: 400 },
        );
      }

      convite = inviteLink;
    }

    const membership_typeStatus = membership_typeInfo.requiresApproval ? "pending" : "approved";

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { name: name.trim() },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Não foi possível criar o acesso. Verifique o e-mail informado." },
        { status: 400 },
      );
    }

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        auth_user_id: authData.user.id,
        email: normalizedEmail,
        name: name.trim(),
        nickname: nickname?.trim() || null,
        birth_date,
        address: address.trim(),
        city_area: city_area.trim(),
        preferred_position,
        membership_type,
        membership_status: membership_typeStatus,
        competition_interest,
        notes: notes?.trim() || null,
      })
      .select("id")
      .single();

    if (playerError || !player) {
      console.error("Erro ao criar atleta:", playerError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Erro ao realizar cadastro. Tente novamente." },
        { status: 500 },
      );
    }

    if (convite) {
      await supabase
        .from("invite_links")
        .update({ used: true })
        .eq("id", convite.id);
    }

    if (membership_typeStatus === "pending") {
      await supabase.from("feed").insert({
        type: "system",
        player_id: null,
        title: "Novo cadastro pendente",
        body: `${name.trim()} solicitou modalidade ${membership_type}. Aguardando aprovação.`,
      });
    }

    const authClient = await createClient();
    const { error: signInError } = await authClient.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      return NextResponse.json({
        success: true,
        redirect: "/login",
      });
    }

    return NextResponse.json({ success: true, redirect: "/a" });
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json(
      { error: "Erro interno. Tente novamente." },
      { status: 500 },
    );
  }
}
