import type { Announcement, FeedItem } from "./types";

export function feedItemMatchesAnnouncement(
  item: FeedItem,
  anuncio: Pick<Announcement, "id" | "title" | "body" | "image_url">,
): boolean {
  if (item.type !== "announcement" || item.player_id !== null) return false;
  if (item.announcement_id === anuncio.id) return true;
  if (item.announcement_id) return false;

  return (
    item.title === anuncio.title &&
    item.body === anuncio.body &&
    (item.image_url ?? null) === (anuncio.image_url ?? null)
  );
}

export function formatAnnouncementWhatsApp(
  title: string,
  body: string,
  imagemUrl?: string | null,
) {
  let text = `🏐 *VolleyHub*\n\n*${title}*`;
  if (body.trim()) text += `\n\n${body}`;
  if (imagemUrl) text += `\n\n📷 ${imagemUrl}`;
  return text;
}

export function formatFeedDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
