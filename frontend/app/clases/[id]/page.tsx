"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  CourseSessionDetailOut,
  SessionAttachmentOut,
  api,
  fetchAttachmentPreviewUrl,
  openAttachment,
} from "@/lib/api";
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
                  <AttachmentRow
                    key={a.id}
                    attachment={a}
                    sessionId={sessionId}
                    token={token!}
                    downloading={openingId === a.id}
                    onDownload={() => handleOpen(a.id, a.filename)}
                  />
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

// PDF nativo, o el PDF convertido de un PPT/PPTX (ver preview_available /
// SessionAttachment.preview_path en el backend) — un tipo no previsualizable
// (Word, imágenes) solo muestra el botón de descarga, sin el de vista previa.
// La vista previa se carga y muestra sola en cuanto se sabe que hay una
// (sin esperar clic) — el alumno puede ocultarla con el mismo botón; el blob
// ya descargado se conserva, así que volver a mostrarla no repite el fetch
// (ni, para un PPT sin convertir aún, la conversión).
// `sm:col-span-2` cuando está expandida: el iframe necesita el ancho
// completo, no la mitad de la grilla de 2 columnas.
function AttachmentRow({
  attachment,
  sessionId,
  token,
  downloading,
  onDownload,
}: {
  attachment: SessionAttachmentOut;
  sessionId: number;
  token: string;
  downloading: boolean;
  onDownload: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Revoca el blob URL al desmontar o al cambiar a otro — no hay que
  // esperar a que el navegador lo recolecte solo.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      setPreviewUrl(await fetchAttachmentPreviewUrl(sessionId, attachment.id, token));
    } catch (err) {
      setPreviewError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setPreviewLoading(false);
    }
  }, [sessionId, attachment.id, token]);

  useEffect(() => {
    if (attachment.preview_available) loadPreview();
  }, [attachment.preview_available, loadPreview]);

  function togglePreview() {
    if (previewUrl) {
      setPreviewExpanded((v) => !v);
      return;
    }
    // Sin blob todavía (la carga automática falló) — reintenta al pedirla.
    setPreviewExpanded(true);
    loadPreview();
  }

  const showingPreview = previewExpanded && previewUrl !== null;

  return (
    <li className={`rounded-md bg-surface p-3 ${showingPreview ? "sm:col-span-2" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-white truncate">{attachment.filename}</p>
          <p className="text-xs text-neutral-500">{formatBytes(attachment.size_bytes)}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {attachment.preview_available && (
            <button
              onClick={togglePreview}
              disabled={previewLoading}
              className="rounded-md border border-surface-border hover:bg-neutral-800 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors"
            >
              {previewLoading ? "Cargando…" : showingPreview ? "Ocultar" : "Vista previa"}
            </button>
          )}
          <button
            onClick={onDownload}
            disabled={downloading}
            className="rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 px-3 py-1.5 text-xs font-medium transition-colors"
          >
            {downloading ? "Abriendo…" : "Ver / descargar"}
          </button>
        </div>
      </div>

      {previewError && <p className="text-xs text-red-400 mt-2">{previewError}</p>}

      {previewExpanded && previewUrl && (
        <iframe
          src={previewUrl}
          title={`Vista previa · ${attachment.filename}`}
          className="w-full rounded-md border border-surface-border mt-3"
          style={{ height: "70vh" }}
        />
      )}
    </li>
  );
}
