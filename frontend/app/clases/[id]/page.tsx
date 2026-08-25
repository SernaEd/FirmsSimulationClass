"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, CourseSessionDetailOut, api, openAttachment } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { useAuth } from "@/lib/useAuth";
import { CARD_SM } from "@/lib/ui";

export default function SesionDetallePage() {
  const params = useParams<{ id: string }>();
  const sessionId = Number(params.id);

  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;

  const [session, setSession] = useState<CourseSessionDetailOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    if (!Number.isFinite(sessionId)) {
      setError("Sesión no válida.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSession(await api.getSession(token, sessionId));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token, sessionId]);

  useEffect(() => {
    if (token) load();
  }, [token, load]);

  async function handleOpen(attachmentId: number, filename: string) {
    if (!token) return;
    setOpeningId(attachmentId);
    setError(null);
    try {
      await openAttachment(sessionId, attachmentId, filename, token);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setOpeningId(null);
    }
  }

  if (authState.status !== "authenticated" || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <Link href="/clases" className="text-sm text-neutral-500 hover:text-neutral-300">
        ← Regresar a Clases
      </Link>

      {error && (
        <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {session && (
        <>
          <header className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-neutral-500">
                Sesión {session.numero_sesion}
              </p>
              <h1 className="text-3xl font-semibold">{session.titulo}</h1>
            </div>
            {session.embed_url && (
              <a
                href={session.embed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-400 hover:text-white underline"
              >
                Abrir en pestaña nueva ↗
              </a>
            )}
          </header>

          {session.embed_url && (
            <iframe
              src={session.embed_url}
              title={session.titulo}
              className="w-full rounded-md border border-surface-border"
              style={{ height: "80vh" }}
            />
          )}

          <section className={`${CARD_SM} p-6`}>
            {session.descripcion ? (
              <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                {session.descripcion}
              </p>
            ) : (
              <p className="text-sm text-neutral-500">Esta sesión aún no tiene descripción.</p>
            )}
          </section>

          <section className={`${CARD_SM} p-6 space-y-3`}>
            <h2 className="text-sm font-semibold text-neutral-300">Material de la clase</h2>
            {session.attachments.length === 0 ? (
              <p className="text-sm text-neutral-500">Todavía no hay archivos adjuntos.</p>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-3">
                {session.attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-md bg-surface p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{a.filename}</p>
                      <p className="text-xs text-neutral-500">{formatBytes(a.size_bytes)}</p>
                    </div>
                    <button
                      onClick={() => handleOpen(a.id, a.filename)}
                      disabled={openingId !== null}
                      className="shrink-0 rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 px-3 py-1.5 text-xs font-medium transition-colors"
                    >
                      {openingId === a.id ? "Abriendo…" : "Ver / descargar"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-md border border-dashed border-surface-border p-6 text-center">
            <p className="text-sm text-neutral-500">Comentarios — próximamente.</p>
          </section>
        </>
      )}
    </main>
  );
}
