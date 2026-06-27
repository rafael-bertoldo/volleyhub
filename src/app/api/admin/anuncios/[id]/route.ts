import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  broadcastAnnouncementDeleted,
  broadcastFeedDeleted,
} from "@/lib/realtime/broadcast-server";
import type { Announcement } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "announcements";

async function findFeedIdsForAnnouncement(
  supabase: SupabaseClient,
  anuncio: Announcement,
): Promise<string[]> {
  const ids = new Set<string>();

  const { data: byAnnouncementId } = await supabase
    .from("feed")
    .select("id")
    .eq("announcement_id", anuncio.id);

  for (const row of byAnnouncementId ?? []) {
    ids.add(row.id);
  }

  let legacyQuery = supabase
    .from("feed")
    .select("id")
    .eq("type", "announcement")
    .is("player_id", null)
    .is("announcement_id", null)
    .eq("title", anuncio.title)
    .eq("body", anuncio.body);

  legacyQuery = anuncio.image_url
    ? legacyQuery.eq("image_url", anuncio.image_url)
    : legacyQuery.is("image_url", null);

  const { data: legacy } = await legacyQuery;

  for (const row of legacy ?? []) {
    ids.add(row.id);
  }

  return [...ids];
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: anuncio } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .single();

  if (!anuncio) {
    return NextResponse.json({ error: "Anúncio não encontrado." }, { status: 404 });
  }

  const feedIds = await findFeedIdsForAnnouncement(supabase, anuncio as Announcement);

  if (feedIds.length > 0) {
    const { error: feedError } = await supabase
      .from("feed")
      .delete()
      .in("id", feedIds);

    if (feedError) {
      console.error("Erro ao excluir feed do anúncio:", feedError);
      return NextResponse.json(
        { error: "Erro ao remover anúncio do feed." },
        { status: 500 },
      );
    }
  }

  if (anuncio.image_url) {
    const path = extractStoragePath(anuncio.image_url);
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }
  }

  const { error: anuncioError } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id);

  if (anuncioError) {
    console.error("Erro ao excluir anúncio:", anuncioError);
    return NextResponse.json({ error: "Erro ao excluir anúncio." }, { status: 500 });
  }

  for (const feedId of feedIds) {
    await broadcastFeedDeleted(feedId);
  }
  await broadcastAnnouncementDeleted(anuncio as Announcement);

  return NextResponse.json({ success: true, feedIds });
}

function extractStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
