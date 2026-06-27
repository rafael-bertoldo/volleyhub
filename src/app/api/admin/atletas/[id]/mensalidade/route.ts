import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getCurrentMembershipFeeMonth, isMember } from "@/lib/mensalidade";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Player } from "@/lib/types";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: player } = await supabase
    .from("players")
    .select("id, membership_type, membership_status")
    .eq("id", id)
    .single();

  if (!player) {
    return NextResponse.json({ error: "Atleta não encontrado." }, { status: 404 });
  }

  if (!isMember(player as Pick<Player, "membership_type" | "membership_status">)) {
    return NextResponse.json(
      { error: "Mensalidade só se aplica a mensalistas aprovados." },
      { status: 400 },
    );
  }

  const mensalidadeMes = getCurrentMembershipFeeMonth();

  const { data, error } = await supabase
    .from("players")
    .update({
      membership_fee_month: mensalidadeMes,
      membership_fee_paid_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, membership_fee_month, membership_fee_paid_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Erro ao registrar pagamento." }, { status: 500 });
  }

  return NextResponse.json({ player: data });
}
