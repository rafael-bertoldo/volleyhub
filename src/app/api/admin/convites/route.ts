import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAdmin } from "@/lib/auth/admin";
import { TOKEN_PATTERN } from "@/lib/convites";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const customToken = (body.token as string | undefined)?.trim();
    const expiraEmDias = Number(body.expira_em_dias) || 0;

    let token = customToken;
    if (token) {
      if (!TOKEN_PATTERN.test(token)) {
        return NextResponse.json(
          {
            error:
              "Identificador inválido. Use 3–40 caracteres (letras, números, - e _).",
          },
          { status: 400 },
        );
      }
    } else {
      token = nanoid(12);
    }

    let expira_em: string | null = null;
    if (expiraEmDias > 0) {
      const expira = new Date();
      expira.setDate(expira.getDate() + expiraEmDias);
      expira_em = expira.toISOString();
    }

    const supabase = createAdminClient();
    const { data: convite, error } = await supabase
      .from("links_convite")
      .insert({ token, expira_em })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Este identificador já está em uso. Escolha outro." },
          { status: 400 },
        );
      }
      console.error("Erro ao criar convite:", error);
      return NextResponse.json(
        { error: "Erro ao gerar link de cadastro." },
        { status: 500 },
      );
    }

    return NextResponse.json({ convite });
  } catch (error) {
    console.error("Erro ao criar convite:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
