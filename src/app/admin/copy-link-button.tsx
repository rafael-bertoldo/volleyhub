"use client";

import { useState } from "react";

interface CopyLinkButtonProps {
  url: string;
  name: string;
}

export function CopyLinkButton({ url, name }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      title={`Copiar link de acesso de ${name}`}
      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
    >
      {copied ? "Copiado!" : "Copiar link"}
    </button>
  );
}
