import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  broadcastAnuncioDeleted,
  broadcastFeedDeleted,
} from "@/lib/realtime/broadcast-server";
import type { Anuncio } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "anuncios";

async function findFeedIdsForAnuncio(
  supabase: SupabaseClient,
  anuncio: Anuncio,
): Promise<string[]> {
  const ids = new Set<string>();

  const { data: byAnuncioId } = await supabase
    .from("feed")
    .select("id")
    .eq("anuncio_id", anuncio.id);

  for (const row of byAnuncioId ?? []) {
    ids.add(row.id);
  }

  let legacyQuery = supabase
    .from("feed")
    .select("id")
    .eq("tipo", "anuncio")
    .is("atleta_id", null)
    .is("anuncio_id", null)
    .eq("titulo", anuncio.titulo)
    .eq("corpo", anuncio.corpo);

  legacyQuery = anuncio.imagem_url
    ? legacyQuery.eq("imagem_url", anuncio.imagem_url)
    : legacyQuery.is("imagem_url", null);

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
    .from("anuncios")
    .select("*")
    .eq("id", id)
    .single();

  if (!anuncio) {
    return NextResponse.json({ error: "Anúncio não encontrado." }, { status: 404 });
  }

  const feedIds = await findFeedIdsForAnuncio(supabase, anuncio as Anuncio);

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

  if (anuncio.imagem_url) {
    const path = extractStoragePath(anuncio.imagem_url);
    if (path) {
      await supabase.storage.from(BUCKET).remove([path]);
    }
  }

  const { error: anuncioError } = await supabase
    .from("anuncios")
    .delete()
    .eq("id", id);

  if (anuncioError) {
    console.error("Erro ao excluir anúncio:", anuncioError);
    return NextResponse.json({ error: "Erro ao excluir anúncio." }, { status: 500 });
  }

  for (const feedId of feedIds) {
    await broadcastFeedDeleted(feedId);
  }
  await broadcastAnuncioDeleted(anuncio as Anuncio);

  return NextResponse.json({ success: true, feedIds });
}

function extractStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
