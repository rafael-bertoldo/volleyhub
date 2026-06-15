import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastGlobalFeed } from "@/lib/realtime/broadcast-server";
import { uploadAnuncioImage } from "@/lib/storage/anuncios";
import type { FeedItem } from "@/lib/types";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const formData = await request.formData();
    const titulo = (formData.get("titulo") as string | null)?.trim();
    const corpo = (formData.get("corpo") as string | null)?.trim() ?? "";
    const imagem = formData.get("imagem") as File | null;
    const hasImage = imagem && imagem.size > 0;

    if (!titulo) {
      return NextResponse.json({ error: "Informe o título." }, { status: 400 });
    }

    if (!corpo && !hasImage) {
      return NextResponse.json(
        { error: "Informe o conteúdo ou envie uma imagem." },
        { status: 400 },
      );
    }

    let imagem_url: string | null = null;
    if (hasImage && imagem) {
      imagem_url = await uploadAnuncioImage(imagem);
    }

    const supabase = createAdminClient();

    const { data: anuncio, error: anuncioError } = await supabase
      .from("anuncios")
      .insert({
        titulo,
        corpo,
        imagem_url,
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
        tipo: "anuncio",
        atleta_id: null,
        anuncio_id: anuncio.id,
        titulo: anuncio.titulo,
        corpo: anuncio.corpo,
        imagem_url: anuncio.imagem_url,
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
