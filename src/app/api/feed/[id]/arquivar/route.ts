import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/player-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: feedId } = await params;
  await request.json().catch(() => null);

  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("archived_feed_items").upsert(
    { player_id: player.id, feed_item_id: feedId },
    { onConflict: "player_id,feed_item_id" },
  );

  if (error) {
    return NextResponse.json({ error: "Erro ao arquivar." }, { status: 500 });
  }

  if (feedId) {
    const { data: feedItem } = await supabase
      .from("feed")
      .select("player_id")
      .eq("id", feedId)
      .single();

    if (feedItem?.player_id === player.id) {
      await supabase.from("feed").update({ is_read: true }).eq("id", feedId);
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: feedId } = await params;
  await request.json().catch(() => null);

  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("archived_feed_items")
    .delete()
    .eq("player_id", player.id)
    .eq("feed_item_id", feedId);

  if (error) {
    return NextResponse.json({ error: "Erro ao restaurar." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
