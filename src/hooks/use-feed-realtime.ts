"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FEED_GLOBAL_CHANNEL,
  REALTIME_EVENTS,
  atletaChannel,
} from "@/lib/realtime/channels";
import { feedItemMatchesAnuncio } from "@/lib/feed";
import type { Anuncio, FeedItem } from "@/lib/types";

function sortFeed(items: FeedItem[]) {
  return [...items].sort(
    (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
  );
}

function mergeFeedItem(items: FeedItem[], item: FeedItem): FeedItem[] {
  if (items.some((i) => i.id === item.id)) return items;
  return sortFeed([item, ...items]);
}

export function useFeedRealtime(
  initialActive: FeedItem[],
  initialArchived: FeedItem[],
  atletaId: string,
) {
  const [active, setActive] = useState(initialActive);
  const [archived, setArchived] = useState(initialArchived);

  useEffect(() => {
    setActive(initialActive);
    setArchived(initialArchived);
  }, [initialActive, initialArchived]);

  useEffect(() => {
    const supabase = createClient();

    function handleNewItem(payload: FeedItem) {
      setActive((prev) => mergeFeedItem(prev, payload));
    }

    function handleDeleted(payload: { id: string }) {
      setActive((prev) => prev.filter((i) => i.id !== payload.id));
      setArchived((prev) => prev.filter((i) => i.id !== payload.id));
    }

    function handleAnuncioDeleted(
      payload: Pick<Anuncio, "id" | "titulo" | "corpo" | "imagem_url">,
    ) {
      const matches = (item: FeedItem) => feedItemMatchesAnuncio(item, payload);
      setActive((prev) => prev.filter((i) => !matches(i)));
      setArchived((prev) => prev.filter((i) => !matches(i)));
    }

    const globalChannel = supabase
      .channel(FEED_GLOBAL_CHANNEL)
      .on("broadcast", { event: REALTIME_EVENTS.FEED_ITEM }, ({ payload }) => {
        handleNewItem(payload as FeedItem);
      })
      .on("broadcast", { event: REALTIME_EVENTS.FEED_DELETED }, ({ payload }) => {
        handleDeleted(payload as { id: string });
      })
      .on("broadcast", { event: REALTIME_EVENTS.ANUNCIO_DELETED }, ({ payload }) => {
        handleAnuncioDeleted(
          payload as Pick<Anuncio, "id" | "titulo" | "corpo" | "imagem_url">,
        );
      })
      .subscribe();

    const privateChannel = supabase
      .channel(atletaChannel(atletaId))
      .on("broadcast", { event: REALTIME_EVENTS.FEED_ITEM }, ({ payload }) => {
        handleNewItem(payload as FeedItem);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
      supabase.removeChannel(privateChannel);
    };
  }, [atletaId]);

  function moveToArchived(item: FeedItem) {
    setActive((prev) => prev.filter((i) => i.id !== item.id));
    setArchived((prev) => mergeFeedItem(prev, item));
  }

  function moveToActive(item: FeedItem) {
    setArchived((prev) => prev.filter((i) => i.id !== item.id));
    setActive((prev) => mergeFeedItem(prev, item));
  }

  return { active, archived, moveToArchived, moveToActive };
}
