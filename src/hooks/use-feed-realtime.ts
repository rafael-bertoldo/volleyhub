"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FEED_GLOBAL_CHANNEL,
  REALTIME_EVENTS,
  playerChannel,
} from "@/lib/realtime/channels";
import { feedItemMatchesAnnouncement } from "@/lib/feed";
import type { Announcement, FeedItem, FeedItemWithCallUp } from "@/lib/types";

function enrichCallUpItem(item: FeedItem): FeedItemWithCallUp {
  if (item.type === "call_up" && item.event_id) {
    return { ...item, call_up_status: "pending" };
  }
  return item;
}

function sortFeed(items: FeedItem[]) {
  return [...items].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function mergeFeedItem(items: FeedItem[], item: FeedItem): FeedItem[] {
  if (items.some((i) => i.id === item.id)) return items;
  return sortFeed([item, ...items]);
}

export function useFeedRealtime(
  initialActive: FeedItemWithCallUp[],
  initialArchived: FeedItemWithCallUp[],
  playerId: string,
) {
  const [active, setActive] = useState(initialActive);
  const [archived, setArchived] = useState(initialArchived);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setActive(initialActive);
      setArchived(initialArchived);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [initialActive, initialArchived]);

  useEffect(() => {
    const supabase = createClient();

    function handleNewItem(payload: FeedItem) {
      setActive((prev) => mergeFeedItem(prev, enrichCallUpItem(payload)));
    }

    function handleDeleted(payload: { id: string }) {
      setActive((prev) => prev.filter((i) => i.id !== payload.id));
      setArchived((prev) => prev.filter((i) => i.id !== payload.id));
    }

    function handleAnnouncementDeleted(
      payload: Pick<Announcement, "id" | "title" | "body" | "image_url">,
    ) {
      const matches = (item: FeedItem) => feedItemMatchesAnnouncement(item, payload);
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
      .on("broadcast", { event: REALTIME_EVENTS.ANNOUNCEMENT_DELETED }, ({ payload }) => {
        handleAnnouncementDeleted(
          payload as Pick<Announcement, "id" | "title" | "body" | "image_url">,
        );
      })
      .subscribe();

    const privateChannel = supabase
      .channel(playerChannel(playerId))
      .on("broadcast", { event: REALTIME_EVENTS.FEED_ITEM }, ({ payload }) => {
        handleNewItem(payload as FeedItem);
      })
      .on("broadcast", { event: REALTIME_EVENTS.FEED_DELETED }, ({ payload }) => {
        handleDeleted(payload as { id: string });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
      supabase.removeChannel(privateChannel);
    };
  }, [playerId]);

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
