import { createAdminClient } from "@/lib/supabase/admin";
import {
  FEED_GLOBAL_CHANNEL,
  REALTIME_EVENTS,
  atletaChannel,
} from "./channels";
import type { Anuncio, FeedItem } from "@/lib/types";

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

export async function broadcastAnuncioDeleted(
  anuncio: Pick<Anuncio, "id" | "titulo" | "corpo" | "imagem_url">,
) {
  try {
    await sendBroadcast(
      FEED_GLOBAL_CHANNEL,
      REALTIME_EVENTS.ANUNCIO_DELETED,
      anuncio,
    );
  } catch (error) {
    console.error("Erro ao enviar broadcast de anúncio excluído:", error);
  }
}

export async function broadcastFeedToAtleta(atletaId: string, item: FeedItem) {
  try {
    await sendBroadcast(atletaChannel(atletaId), REALTIME_EVENTS.FEED_ITEM, item);
  } catch (error) {
    console.error("Erro ao enviar broadcast de feed:", error);
  }
}

export async function broadcastPresencaUpdate(eventoId: string, payload: unknown) {
  try {
    await sendBroadcast(
      `treino:${eventoId}`,
      REALTIME_EVENTS.PRESENCA_UPDATE,
      payload,
    );
  } catch (error) {
    console.error("Erro ao enviar broadcast de presença:", error);
  }
}

export async function broadcastConvocacaoUpdate(atletaId: string, payload: unknown) {
  try {
    await sendBroadcast(
      atletaChannel(atletaId),
      REALTIME_EVENTS.CONVOCACAO_UPDATE,
      payload,
    );
  } catch (error) {
    console.error("Erro ao enviar broadcast de convocação:", error);
  }
}
