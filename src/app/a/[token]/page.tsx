export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAtletaByToken } from "@/lib/atleta-server";
import type { FeedItem } from "@/lib/types";
import { FeedList } from "./feed-list";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function FeedPage({ params }: PageProps) {
  const { token } = await params;
  const atleta = await getAtletaByToken(token);

  if (!atleta) {
    notFound();
  }

  const supabase = createAdminClient();

  const [{ data: feedItems }, { data: arquivados }] = await Promise.all([
    supabase
      .from("feed")
      .select("*")
      .or(`and(atleta_id.is.null,tipo.eq.anuncio),atleta_id.eq.${atleta.id}`)
      .order("criado_em", { ascending: false }),
    supabase
      .from("feed_arquivados")
      .select("feed_id")
      .eq("atleta_id", atleta.id),
  ]);

  const arquivadosIds = new Set((arquivados ?? []).map((a) => a.feed_id));
  const allItems = (feedItems ?? []) as FeedItem[];

  const activeItems = allItems.filter((i) => !arquivadosIds.has(i.id));
  const archivedItems = allItems.filter((i) => arquivadosIds.has(i.id));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Feed</h1>
      <FeedList
        activeItems={activeItems}
        archivedItems={archivedItems}
        atletaId={atleta.id}
        accessToken={token}
      />
    </div>
  );
}
