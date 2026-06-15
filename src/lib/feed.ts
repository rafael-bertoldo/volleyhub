import type { Anuncio, FeedItem } from "./types";

export function feedItemMatchesAnuncio(
  item: FeedItem,
  anuncio: Pick<Anuncio, "id" | "titulo" | "corpo" | "imagem_url">,
): boolean {
  if (item.tipo !== "anuncio" || item.atleta_id !== null) return false;
  if (item.anuncio_id === anuncio.id) return true;
  if (item.anuncio_id) return false;

  return (
    item.titulo === anuncio.titulo &&
    item.corpo === anuncio.corpo &&
    (item.imagem_url ?? null) === (anuncio.imagem_url ?? null)
  );
}

export function formatAnuncioWhatsApp(
  titulo: string,
  corpo: string,
  imagemUrl?: string | null,
) {
  let text = `🏐 *Roxinhos*\n\n*${titulo}*`;
  if (corpo.trim()) text += `\n\n${corpo}`;
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
