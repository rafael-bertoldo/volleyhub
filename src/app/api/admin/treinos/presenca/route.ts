import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { broadcastAttendanceUpdate } from "@/lib/realtime/broadcast-server";
import {
  executarAcaoAdminAttendance,
  type AdminAttendanceAction,
} from "@/lib/treinos-server";
import { createAdminClient } from "@/lib/supabase/admin";

const ACTIONS: AdminAttendanceAction[] = [
  "confirmar_pagamento",
  "rejeitar_pagamento",
  "subir_fila",
];

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { attendance_id, action } = await request.json();

  if (!attendance_id || !action) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (!ACTIONS.includes(action as AdminAttendanceAction)) {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: attendance } = await supabase
    .from("attendances")
    .select("event_id")
    .eq("id", attendance_id)
    .single();

  if (!attendance) {
    return NextResponse.json({ error: "Presença não encontrada." }, { status: 404 });
  }

  const result = await executarAcaoAdminAttendance(
    attendance_id,
    action as AdminAttendanceAction,
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await broadcastAttendanceUpdate(attendance.event_id, {
    event_id: attendance.event_id,
    action,
  });

  return NextResponse.json({ success: true });
}
