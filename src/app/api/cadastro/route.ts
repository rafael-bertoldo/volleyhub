import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { athleteCookieOptions } from "@/lib/auth/athlete-cookie";
import { MODALIDADES } from "@/lib/constants";
import type { CadastroFormData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CadastroFormData & {
      convite_token: string;
    };

    const {
      convite_token,
      nome,
      nascimento,
      endereco,
      bairro_cidade,
      modalidade,
      interesse_competicoes,
      observacoes,
    } = body;

    if (
      !convite_token ||
      !nome?.trim() ||
      !nascimento ||
      !endereco?.trim() ||
      !bairro_cidade?.trim() ||
      !modalidade ||
      !interesse_competicoes
    ) {
      return NextResponse.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 },
      );
    }

    const modalidadeInfo = MODALIDADES.find((m) => m.value === modalidade);
    if (!modalidadeInfo) {
      return NextResponse.json({ error: "Modalidade inválida." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: convite, error: conviteError } = await supabase
      .from("links_convite")
      .select("*")
      .eq("token", convite_token)
      .single();

    if (conviteError || !convite) {
      return NextResponse.json(
        { error: "Link de cadastro inválido." },
        { status: 404 },
      );
    }

    if (convite.usado) {
      return NextResponse.json(
        { error: "Este link de cadastro já foi utilizado." },
        { status: 400 },
      );
    }

    if (convite.expira_em && new Date(convite.expira_em) < new Date()) {
      return NextResponse.json(
        { error: "Este link de cadastro expirou." },
        { status: 400 },
      );
    }

    const accessToken = nanoid(32);
    const modalidadeStatus = modalidadeInfo.requerAprovacao ? "pendente" : "aprovado";

    const { data: atleta, error: atletaError } = await supabase
      .from("atletas")
      .insert({
        nome: nome.trim(),
        nascimento,
        endereco: endereco.trim(),
        bairro_cidade: bairro_cidade.trim(),
        modalidade,
        modalidade_status: modalidadeStatus,
        interesse_competicoes,
        observacoes: observacoes?.trim() || null,
        access_token: accessToken,
      })
      .select("access_token")
      .single();

    if (atletaError || !atleta) {
      console.error("Erro ao criar atleta:", atletaError);
      return NextResponse.json(
        { error: "Erro ao realizar cadastro. Tente novamente." },
        { status: 500 },
      );
    }

    await supabase
      .from("links_convite")
      .update({ usado: true })
      .eq("id", convite.id);

    if (modalidadeStatus === "pendente") {
      await supabase.from("feed").insert({
        tipo: "sistema",
        atleta_id: null,
        titulo: "Novo cadastro pendente",
        corpo: `${nome.trim()} solicitou modalidade ${modalidade}. Aguardando aprovação.`,
      });
    }

    const response = NextResponse.json({
      access_token: atleta.access_token,
      redirect: `/a/${atleta.access_token}`,
    });

    response.cookies.set(athleteCookieOptions(atleta.access_token));

    return response;
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return NextResponse.json(
      { error: "Erro interno. Tente novamente." },
      { status: 500 },
    );
  }
}
