export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentPlayer } from "@/lib/player-server";
import { getCallUpStatusPorEvent } from "@/lib/jogos-server";
import type { FeedItemWithCallUp } from "@/lib/types";
import { FeedList } from "./feed-list";

export default async function FeedPage() {
  const player = await getCurrentPlayer();

  if (!player) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  const [{ data: feedItems }, { data: arquivados }] = await Promise.all([
    supabase
      .from("feed")
      .select("*")
      .or(`and(player_id.is.null,type.eq.announcement),player_id.eq.${player.id}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("archived_feed_items")
      .select("feed_item_id")
      .eq("player_id", player.id),
  ]);

  const arquivadosIds = new Set((arquivados ?? []).map((a) => a.feed_item_id));
  const allItems = (feedItems ?? []) as FeedItemWithCallUp[];

  const convocacaoEventIds = allItems
    .filter((i) => i.type === "call_up" && i.event_id)
    .map((i) => i.event_id as string);

  const convocacaoStatus = await getCallUpStatusPorEvent(
    player.id,
    convocacaoEventIds,
  );

  for (const item of allItems) {
    if (item.type === "call_up" && item.event_id) {
      item.call_up_status =
        (convocacaoStatus.get(item.event_id) as FeedItemWithCallUp["call_up_status"]) ??
        "pending";
    }
  }

  const activeItems = allItems.filter((i) => !arquivadosIds.has(i.id));
  const archivedItems = allItems.filter((i) => arquivadosIds.has(i.id));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Feed</h1>
      <FeedList
        activeItems={activeItems}
        archivedItems={archivedItems}
        playerId={player.id}
      />
    </div>
  );
}
