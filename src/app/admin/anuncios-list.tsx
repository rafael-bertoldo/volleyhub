"use client";

import { useState } from "react";
import { AnuncioImage } from "@/components/anuncio-image";
import { formatAnuncioWhatsApp, formatFeedDate } from "@/lib/feed";
import type { Anuncio } from "@/lib/types";
import { DeleteAnuncioButton } from "./delete-anuncio-button";

function CopyWhatsAppButton({
  titulo,
  corpo,
  imagemUrl,
}: {
  titulo: string;
  corpo: string;
  imagemUrl?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = formatAnuncioWhatsApp(titulo, corpo, imagemUrl);
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

function DownloadImageButton({ url, titulo }: { url: string; titulo: string }) {
  return (
    <a
      href={url}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-violet-100 text-violet-800 hover:bg-violet-200 transition-colors"
    >
      Baixar imagem
    </a>
  );
}

interface AnunciosListProps {
  anuncios: Anuncio[];
}

export function AnunciosList({ anuncios }: AnunciosListProps) {
  if (!anuncios.length) {
    return (
      <p className="text-sm text-gray-500">Nenhum anúncio publicado ainda.</p>
    );
  }

  return (
    <div className="space-y-3">
      {anuncios.map((anuncio) => (
        <div
          key={anuncio.id}
          className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="font-semibold text-gray-900">{anuncio.titulo}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatFeedDate(anuncio.criado_em)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {anuncio.imagem_url && (
                <DownloadImageButton url={anuncio.imagem_url} titulo={anuncio.titulo} />
              )}
              <CopyWhatsAppButton
                titulo={anuncio.titulo}
                corpo={anuncio.corpo}
                imagemUrl={anuncio.imagem_url}
              />
              <DeleteAnuncioButton anuncioId={anuncio.id} titulo={anuncio.titulo} />
            </div>
          </div>

          {anuncio.imagem_url && (
            <AnuncioImage src={anuncio.imagem_url} alt={anuncio.titulo} />
          )}

          {anuncio.corpo && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{anuncio.corpo}</p>
          )}
        </div>
      ))}
    </div>
  );
}
