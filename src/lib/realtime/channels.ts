export const REALTIME_EVENTS = {
  FEED_ITEM: "feed_item",
  FEED_DELETED: "feed_deleted",
  ANNOUNCEMENT_DELETED: "anuncio_deleted",
  ATTENDANCE_UPDATE: "attendance_update",
  CALL_UP_UPDATE: "convocacao_update",
} as const;

export const FEED_GLOBAL_CHANNEL = "feed:global";

export function playerChannel(playerId: string) {
  return `player:${playerId}`;
}

export function trainingChannel(eventId: string) {
  return `treino:${eventId}`;
}

export function gameChannel(eventId: string) {
  return `jogo:${eventId}`;
}
