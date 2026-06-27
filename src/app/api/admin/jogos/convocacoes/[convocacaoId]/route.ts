import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { removerCallUp } from "@/lib/jogos-server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ convocacaoId: string }> },
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { convocacaoId } = await params;
  const result = await removerCallUp(convocacaoId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
