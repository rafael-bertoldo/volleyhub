export const REALTIME_EVENTS = {
  FEED_ITEM: "feed_item",
  FEED_DELETED: "feed_deleted",
  ANUNCIO_DELETED: "anuncio_deleted",
  PRESENCA_UPDATE: "presenca_update",
  CONVOCACAO_UPDATE: "convocacao_update",
} as const;

export const FEED_GLOBAL_CHANNEL = "feed:global";

export function atletaChannel(atletaId: string) {
  return `atleta:${atletaId}`;
}

export function treinoChannel(eventoId: string) {
  return `treino:${eventoId}`;
}
