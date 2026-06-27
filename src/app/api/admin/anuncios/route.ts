import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastGlobalFeed } from "@/lib/realtime/broadcast-server";
import { uploadAnnouncementImage } from "@/lib/storage/announcements";
import type { FeedItem } from "@/lib/types";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const title = (formData.get("title") as string | null)?.trim();
    const body = (formData.get("body") as string | null)?.trim() ?? "";
    const imagem = formData.get("imagem") as File | null;
    const hasImage = imagem && imagem.size > 0;

    if (!title) {
      return NextResponse.json({ error: "Informe o título." }, { status: 400 });
    }

    if (!body && !hasImage) {
      return NextResponse.json(
        { error: "Informe o conteúdo ou envie uma imagem." },
        { status: 400 },
      );
    }

    let image_url: string | null = null;
    if (hasImage && imagem) {
      image_url = await uploadAnnouncementImage(imagem);
    }

    const supabase = createAdminClient();

    const { data: anuncio, error: anuncioError } = await supabase
      .from("announcements")
      .insert({
        title,
        body,
        image_url,
      })
      .select()
      .single();

    if (anuncioError || !anuncio) {
      console.error("Erro ao criar anúncio:", anuncioError);
      return NextResponse.json(
        { error: "Erro ao publicar anúncio." },
        { status: 500 },
      );
    }

    const { data: feedItem, error: feedError } = await supabase
      .from("feed")
      .insert({
        type: "announcement",
        player_id: null,
        announcement_id: anuncio.id,
        title: anuncio.title,
        body: anuncio.body,
        image_url: anuncio.image_url,
      })
      .select()
      .single();

    if (feedError || !feedItem) {
      console.error("Erro ao inserir no feed:", feedError);
    } else {
      await broadcastGlobalFeed(feedItem as FeedItem);
    }

    return NextResponse.json({ anuncio });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
