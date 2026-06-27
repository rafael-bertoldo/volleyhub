"use client";

import { useState } from "react";
import { AnnouncementImage } from "@/components/anuncio-image";
import { formatAnnouncementWhatsApp, formatFeedDate } from "@/lib/feed";
import type { Announcement } from "@/lib/types";
import { DeleteAnnouncementButton } from "./delete-anuncio-button";

function CopyWhatsAppButton({
  title,
  body,
  imagemUrl,
}: {
  title: string;
  body: string;
  imagemUrl?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = formatAnnouncementWhatsApp(title, body, imagemUrl);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
    >
      {copied ? "Copiado!" : "Copiar p/ WhatsApp"}
    </button>
  );
}

function DownloadImageButton({ url, title }: { url: string; title: string }) {
  return (
    <a
      href={url}
      download={title}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-violet-100 text-violet-800 hover:bg-violet-200 transition-colors"
    >
      Baixar imagem
    </a>
  );
}

interface AnnouncementsListProps {
  announcements: Announcement[];
}

export function AnnouncementsList({ announcements }: AnnouncementsListProps) {
  if (!announcements.length) {
    return (
      <p className="text-sm text-gray-500">Nenhum anúncio publicado ainda.</p>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((anuncio) => (
        <div
          key={anuncio.id}
          className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-gray-900">{anuncio.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatFeedDate(anuncio.created_at)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {anuncio.image_url && (
                <DownloadImageButton url={anuncio.image_url} title={anuncio.title} />
              )}
              <CopyWhatsAppButton
                title={anuncio.title}
                body={anuncio.body}
                imagemUrl={anuncio.image_url}
              />
              <DeleteAnnouncementButton anuncioId={anuncio.id} title={anuncio.title} />
            </div>
          </div>

          {anuncio.image_url && (
            <AnnouncementImage src={anuncio.image_url} alt={anuncio.title} />
          )}

          {anuncio.body && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{anuncio.body}</p>
          )}
        </div>
      ))}
    </div>
  );
}
