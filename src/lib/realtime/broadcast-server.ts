import { createAdminClient } from "@/lib/supabase/admin";
import {
  FEED_GLOBAL_CHANNEL,
  REALTIME_EVENTS,
  playerChannel,
  gameChannel,
} from "./channels";
import type { Announcement, FeedItem } from "@/lib/types";

async function sendBroadcast(
  channelName: string,
  event: string,
  payload: unknown,
): Promise<void> {
  const supabase = createAdminClient();
  const channel = supabase.channel(channelName, {
    config: { broadcast: { ack: true, self: false } },
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      supabase.removeChannel(channel);
      reject(new Error(`Broadcast timeout no canal ${channelName}`));
    }, 5000);

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        try {
          await channel.send({ type: "broadcast", event, payload });
          clearTimeout(timeout);
          supabase.removeChannel(channel);
          resolve();
        } catch (err) {
          clearTimeout(timeout);
          supabase.removeChannel(channel);
          reject(err);
        }
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timeout);
        supabase.removeChannel(channel);
        reject(new Error(`Broadcast falhou: ${status}`));
      }
    });
  });
}

export async function broadcastGlobalFeed(item: FeedItem) {
  try {
    await sendBroadcast(FEED_GLOBAL_CHANNEL, REALTIME_EVENTS.FEED_ITEM, item);
  } catch (error) {
    console.error("Erro ao enviar broadcast global de feed:", error);
  }
}

export async function broadcastFeedDeleted(feedId: string) {
  try {
    await sendBroadcast(FEED_GLOBAL_CHANNEL, REALTIME_EVENTS.FEED_DELETED, {
      id: feedId,
    });
  } catch (error) {
    console.error("Erro ao enviar broadcast de exclusão:", error);
  }
}

export async function broadcastFeedDeletedToPlayer(playerId: string, feedId: string) {
  try {
    await sendBroadcast(playerChannel(playerId), REALTIME_EVENTS.FEED_DELETED, {
      id: feedId,
    });
  } catch (error) {
    console.error("Erro ao enviar broadcast de exclusão do feed do player:", error);
  }
}

export async function broadcastAnnouncementDeleted(
  anuncio: Pick<Announcement, "id" | "title" | "body" | "image_url">,
) {
  try {
    await sendBroadcast(
      FEED_GLOBAL_CHANNEL,
      REALTIME_EVENTS.ANNOUNCEMENT_DELETED,
      anuncio,
    );
  } catch (error) {
    console.error("Erro ao enviar broadcast de anúncio excluído:", error);
  }
}

export async function broadcastFeedToPlayer(playerId: string, item: FeedItem) {
  try {
    await sendBroadcast(playerChannel(playerId), REALTIME_EVENTS.FEED_ITEM, item);
  } catch (error) {
    console.error("Erro ao enviar broadcast de feed:", error);
  }
}

export async function broadcastAttendanceUpdate(eventId: string, payload: unknown) {
  try {
    await sendBroadcast(
      `treino:${eventId}`,
      REALTIME_EVENTS.ATTENDANCE_UPDATE,
      payload,
    );
  } catch (error) {
    console.error("Erro ao enviar broadcast de presença:", error);
  }
}

export async function broadcastCallUpUpdate(playerId: string, payload: unknown) {
  try {
    await sendBroadcast(
      playerChannel(playerId),
      REALTIME_EVENTS.CALL_UP_UPDATE,
      payload,
    );
  } catch (error) {
    console.error("Erro ao enviar broadcast de convocação:", error);
  }
}

export async function broadcastJogoCallUpUpdate(eventId: string, payload: unknown) {
  try {
    await sendBroadcast(
      gameChannel(eventId),
      REALTIME_EVENTS.CALL_UP_UPDATE,
      payload,
    );
  } catch (error) {
    console.error("Erro ao enviar broadcast de convocação do jogo:", error);
  }
}
