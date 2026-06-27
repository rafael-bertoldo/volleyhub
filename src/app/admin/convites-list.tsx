"use client";

import {
  CONVITE_STATUS_BADGE,
  CONVITE_STATUS_LABEL,
  conviteCadastroUrl,
  formatConviteDate,
  getConviteStatus,
} from "@/lib/convites";
import type { InviteLink } from "@/lib/types";
import { CopyLinkButton } from "./copy-link-button";

interface ConvitesListProps {
  convites: InviteLink[];
  appUrl: string;
}

export function ConvitesList({ convites, appUrl }: ConvitesListProps) {
  if (!convites.length) {
    return (
      <p className="text-sm text-gray-500">Nenhum link gerado ainda.</p>
    );
  }

  return (
    <div className="space-y-3">
      {convites.map((convite) => {
        const status = getConviteStatus(convite);
        const url = conviteCadastroUrl(convite.token, appUrl);
        const podeCopiar = status === "disponivel";

        return (
          <article
            key={convite.id}
            className="rounded-xl border border-gray-100 p-4 space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <code className="text-sm font-medium text-gray-900">{convite.token}</code>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONVITE_STATUS_BADGE[status]}`}
              >
                {CONVITE_STATUS_LABEL[status]}
              </span>
            </div>

            <p className="text-xs text-gray-500 break-all font-mono">{url}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span>Criado em {formatConviteDate(convite.created_at)}</span>
              {convite.expires_at && (
                <span>Expira em {formatConviteDate(convite.expires_at)}</span>
              )}
            </div>

            {podeCopiar && (
              <CopyLinkButton url={url} name={convite.token} />
            )}
          </article>
        );
      })}
    </div>
  );
}
