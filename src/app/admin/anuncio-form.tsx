"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function AnuncioForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImagem(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }

  function removeImage() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImagem(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!corpo.trim() && !imagem) {
      setError("Informe o conteúdo ou envie uma imagem.");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("corpo", corpo);
      if (imagem) formData.append("imagem", imagem);

      const res = await fetch("/api/admin/anuncios", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao publicar.");
        return;
      }

      setTitulo("");
      setCorpo("");
      removeImage();
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          Anúncio publicado no feed dos atletas!
        </div>
      )}

      <div>
        <label htmlFor="anuncio-titulo" className="block text-sm font-medium text-gray-700 mb-1">
          Título *
        </label>
        <input
          id="anuncio-titulo"
          type="text"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="input-field"
          placeholder="Ex: Escalação do amistoso"
        />
      </div>

      <div>
        <label htmlFor="anuncio-corpo" className="block text-sm font-medium text-gray-700 mb-1">
          Conteúdo
        </label>
        <textarea
          id="anuncio-corpo"
          rows={3}
          value={corpo}
          onChange={(e) => setCorpo(e.target.value)}
          className="input-field resize-none"
          placeholder="Texto complementar (opcional se enviar imagem)"
        />
      </div>

      <div>
        <label htmlFor="anuncio-imagem" className="block text-sm font-medium text-gray-700 mb-1">
          Imagem do anúncio
        </label>
        <input
          ref={fileInputRef}
          id="anuncio-imagem"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        />
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP ou GIF · máx. 5 MB</p>
      </div>

      {previewUrl && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Prévia do anúncio"
            className="w-full h-auto object-contain max-h-96 rounded-lg bg-gray-100"
          />
          <button
            type="button"
            onClick={removeImage}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Remover imagem
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm text-white font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Publicando..." : "Publicar anúncio"}
      </button>
    </form>
  );
}
