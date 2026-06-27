"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnnouncementImage } from "@/components/anuncio-image";
import { useFeedRealtime } from "@/hooks/use-feed-realtime";
import { formatFeedDate } from "@/lib/feed";
import { CONVOCACAO_STATUS_BADGE, CONVOCACAO_STATUS_LABEL } from "@/lib/jogos";
import type { FeedItemWithCallUp, CallUpStatus, FeedItemType } from "@/lib/types";

interface FeedListProps {
  activeItems: FeedItemWithCallUp[];
  archivedItems: FeedItemWithCallUp[];
  playerId: string;
}

const TIPO_CONFIG: Record<
  FeedItemType,
  { label: string; border: string; badge: string }
> = {
  announcement: {
    label: "Anúncio",
    border: "border-l-violet-500",
    badge: "bg-violet-100 text-violet-700",
  },
  system: {
    label: "Aviso",
    border: "border-l-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  call_up: {
    label: "Convocação",
    border: "border-l-amber-500",
    badge: "bg-amber-100 text-amber-800",
  },
  reminder: {
    label: "Lembrete",
    border: "border-l-gray-400",
    badge: "bg-gray-100 text-gray-700",
  },
};

export function FeedList({
  activeItems,
  archivedItems,
  playerId,
}: FeedListProps) {
  const { active, archived, moveToArchived, moveToActive } = useFeedRealtime(
    activeItems,
    archivedItems,
    playerId,
  );
  const [showArchived, setShowArchived] = useState(false);

  if (!active.length && !archived.length) {
    return <p className="text-sm text-gray-500">Nenhum aviso por enquanto.</p>;
  }

  return (
    <div className="space-y-4">
      {active.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum aviso novo.</p>
      ) : (
        <div className="space-y-3">
          {active.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              mode="active"
              onArchive={() => moveToArchived(item)}
            />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <span className="text-gray-400">{showArchived ? "▾" : "▸"}</span>
            <ArchiveIcon className="text-gray-500" />
            Arquivados ({archived.length})
          </button>

          {showArchived && (
            <div className="space-y-3 mt-3">
              {archived.map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  mode="archived"
                  onRestore={() => moveToActive(item)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function resolveCallUpStatus(item: FeedItemWithCallUp): CallUpStatus | null {
  if (item.type !== "call_up" || !item.event_id) return null;
  return item.call_up_status ?? "pending";
}

function FeedCard({
  item,
  mode,
  onArchive,
  onRestore,
}: {
  item: FeedItemWithCallUp;
  mode: "active" | "archived";
  onArchive?: () => void;
  onRestore?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locationCallUpStatus, setLocalCallUpStatus] =
    useState<CallUpStatus | null>(null);

  const callUpStatus = locationCallUpStatus ?? resolveCallUpStatus(item);
  const config = TIPO_CONFIG[item.type];
  const isPrivate = item.player_id !== null;
  const showUnread = mode === "active" && isPrivate && !item.is_read;
  const isCallUp = item.type === "call_up" && item.event_id;
  const callUpPending = isCallUp && callUpStatus === "pending";

  async function handleResponder(resposta: "accepted" | "declined") {
    if (!item.event_id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/call-ups/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: item.event_id,
          resposta,
        }),
      });
      if (res.ok) {
        setLocalCallUpStatus(resposta);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive() {
    setLoading(true);
    try {
      const res = await fetch(`/api/feed/${item.id}/arquivar`, {
        method: "POST",
      });
      if (res.ok) onArchive?.();
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/feed/${item.id}/arquivar`, {
        method: "DELETE",
      });
      if (res.ok) onRestore?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <article
      className={`rounded-xl border border-gray-100 bg-white p-4 border-l-4 ${config.border} ${
        mode === "archived" ? "opacity-75" : ""
      } ${showUnread ? "ring-1 ring-violet-200" : ""}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badge}`}
        >
          {config.label}
        </span>
        {showUnread && (
          <span className="text-xs font-medium text-violet-600">Novo</span>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {formatFeedDate(item.created_at)}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900">{item.title}</h3>

      {item.image_url && (
        <div className="mt-2">
          <AnnouncementImage src={item.image_url} alt={item.title} />
        </div>
      )}

      {item.body && (
        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{item.body}</p>
      )}

      {isCallUp && callUpStatus && callUpStatus !== "pending" && (
        <p className="mt-2">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${CONVOCACAO_STATUS_BADGE[callUpStatus]}`}
          >
            {CONVOCACAO_STATUS_LABEL[callUpStatus]}
          </span>
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2">
        {mode === "active" && callUpPending && (
          <>
            <button
              type="button"
              onClick={() => handleResponder("declined")}
              disabled={loading}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Recusar
            </button>
            <button
              type="button"
              onClick={() => handleResponder("accepted")}
              disabled={loading}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Aceitar"}
            </button>
          </>
        )}
        {mode === "active" ? (
          <button
            type="button"
            onClick={handleArchive}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 active:bg-violet-100 disabled:opacity-50 transition-colors"
          >
            <ArchiveIcon />
            {loading ? "Arquivando..." : "Arquivar"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRestore}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 active:bg-violet-200 disabled:opacity-50 transition-colors"
          >
            <RestoreIcon />
            {loading ? "Restaurando..." : "Restaurar ao feed"}
          </button>
        )}
      </div>
    </article>
  );
}

function ArchiveIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`size-4 shrink-0 ${className}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h.153a1 1 0 0 0 .986-.836l.03-.18.085-.51A1 1 0 0 1 4.22 3h11.56a1 1 0 0 1 .986.836l.085.51.03.18H18a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1v9.586a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h.153ZM6.447 6H5.58a1 1 0 0 0-.967.728l-.73 4.25.023.007A1 1 0 0 0 5.493 12h9.014a1 1 0 0 0 .987-.836l-.73-4.25a1 1 0 0 0-.967-.728H6.447Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function RestoreIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-4 shrink-0"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 1 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
