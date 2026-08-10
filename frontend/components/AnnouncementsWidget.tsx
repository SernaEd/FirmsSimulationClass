"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, StudentAnnouncementOut, api } from "@/lib/api";
import { renderMarkdownLite } from "@/lib/markdown-lite";

const VISIBLE_LIMIT = 3;

/** Fila 0 del Dashboard (§14.2): anuncios del profesor, anclados y de
 * prioridad alta primero. Muestra hasta 3; el resto vive en /anuncios. */
export function AnnouncementsWidget({ token }: { token: string }) {
  const [items, setItems] = useState<StudentAnnouncementOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.myAnnouncements(token);
      setItems(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkRead(id: number) {
    // Optimista: lo marcamos leído en la UI de inmediato.
    setItems((prev) => prev?.map((a) => (a.id === id ? { ...a, leido: true } : a)) ?? prev);
    try {
      await api.markAnnouncementRead(token, id);
    } catch {
      load(); // si falló, recargamos para reflejar el estado real
    }
  }

  if (error) {
    return (
      <p className="text-xs text-red-400">Error cargando anuncios: {error}</p>
    );
  }
  if (items === null) {
    return null; // evita parpadeo; el resto del Dashboard carga sin bloquearse
  }
  if (items.length === 0) {
    return null; // sin anuncios activos: no ocupamos espacio en Fila 0
  }

  const visible = items.slice(0, VISIBLE_LIMIT);
  const remaining = items.length - visible.length;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-neutral-500">
          Anuncios del profesor
        </p>
        {remaining > 0 && (
          <Link href="/anuncios" className="text-xs text-neutral-400 hover:text-white underline">
            Ver todos ({items.length})
          </Link>
        )}
      </div>
      <div className="grid gap-2">
        {visible.map((a) => (
          <AnnouncementCard key={a.id} announcement={a} onMarkRead={() => handleMarkRead(a.id)} />
        ))}
      </div>
    </section>
  );
}

export function AnnouncementCard({
  announcement: a,
  onMarkRead,
}: {
  announcement: StudentAnnouncementOut;
  onMarkRead: () => void;
}) {
  return (
    <article
      className={
        "rounded-lg border p-4 space-y-2 " +
        (a.prioridad === "alta"
          ? "border-ibero-red/60 bg-ibero-red/5"
          : "border-surface-border bg-surface-raised")
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {a.anclado && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 shrink-0">
              Anclado
            </span>
          )}
          {a.prioridad === "alta" && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-ibero-red/20 text-ibero-red shrink-0">
              Prioridad alta
            </span>
          )}
          <h3 className="text-sm font-semibold text-white truncate">{a.titulo}</h3>
        </div>
        {!a.leido && (
          <span className="h-2 w-2 rounded-full bg-ibero-red shrink-0 mt-1.5" title="Sin leer" />
        )}
      </div>

      <div
        className="text-sm text-neutral-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: renderMarkdownLite(a.cuerpo_md) }}
      />

      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-neutral-500">
          {new Date(a.publicado_at).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
        {!a.leido && (
          <button
            onClick={onMarkRead}
            className="text-xs text-neutral-400 hover:text-white underline"
          >
            Marcar como visto
          </button>
        )}
      </div>
    </article>
  );
}
