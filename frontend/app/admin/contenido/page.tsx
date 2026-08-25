"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError, CourseSessionDetailOut, ModuleOut, api } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import { useAuth } from "@/lib/useAuth";
import { toggleSet } from "@/lib/toggleSet";

const ACCEPTED_TYPES = ".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg";

// ---------------------------------------------------------------------------
// Campos compartidos (formularios de módulo/sesión)
// ---------------------------------------------------------------------------

function NumberTitleFields({
  numeroLabel,
  numero,
  onNumeroChange,
  tituloLabel,
  titulo,
  onTituloChange,
}: {
  numeroLabel: string;
  numero: string;
  onNumeroChange: (v: string) => void;
  tituloLabel: string;
  titulo: string;
  onTituloChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-3">
      <label className="space-y-1">
        <span className="text-xs font-medium text-neutral-300">{numeroLabel}</span>
        <input
          type="number"
          min={1}
          value={numero}
          onChange={(e) => onNumeroChange(e.target.value)}
          required
          className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-medium text-neutral-300">{tituloLabel}</span>
        <input
          value={titulo}
          onChange={(e) => onTituloChange(e.target.value)}
          required
          minLength={1}
          maxLength={200}
          className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
        />
      </label>
    </div>
  );
}

function DescriptionField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-neutral-300">Descripción (opcional)</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
      />
    </label>
  );
}

function EmbedUrlField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-neutral-300">
        Enlace embebido (opcional)
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/clase1-content/index.html"
        className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
      />
      <span className="block text-xs text-neutral-500">
        Para presentaciones/decks interactivos que se muestran en un iframe
        dentro de la sesión, en vez de un archivo descargable. Ruta relativa
        (ej. &quot;/clase1-content/index.html&quot;) o URL completa.
      </span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Adjuntos
// ---------------------------------------------------------------------------

function AttachmentsPanel({
  session,
  token,
  onChanged,
}: {
  session: CourseSessionDetailOut;
  token: string;
  onChanged: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await api.adminUploadAttachment(token, session.id, file);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(attachmentId: number) {
    if (!confirm("¿Eliminar este adjunto?")) return;
    setBusyId(attachmentId);
    setError(null);
    try {
      await api.adminDeleteAttachment(token, attachmentId);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2">
      {session.attachments.length === 0 ? (
        <p className="text-xs text-neutral-500">Sin adjuntos.</p>
      ) : (
        <ul className="space-y-1">
          {session.attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 rounded-md border border-surface-border/60 bg-neutral-900 px-3 py-1.5 text-xs"
            >
              <span className="truncate text-neutral-300">
                {a.filename}{" "}
                <span className="text-neutral-600">· {formatBytes(a.size_bytes)}</span>
              </span>
              <button
                onClick={() => handleDelete(a.id)}
                disabled={busyId !== null}
                className="shrink-0 rounded border border-red-800 hover:bg-red-950/40 disabled:opacity-50 px-2 py-1 text-red-300"
              >
                {busyId === a.id ? "…" : "Eliminar"}
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="inline-block">
        <span className="rounded-md border border-dashed border-surface-border hover:border-ibero-red hover:text-ibero-red px-3 py-1.5 text-xs text-neutral-400 transition-colors cursor-pointer">
          {uploading ? "Subiendo…" : "+ Subir archivo"}
        </span>
        <input
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sesiones
// ---------------------------------------------------------------------------

function SessionRow({
  sessionSummary,
  token,
  onChanged,
}: {
  sessionSummary: { id: number; numero_sesion: number; titulo: string };
  token: string;
  onChanged: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<CourseSessionDetailOut | null>(null);
  const [editing, setEditing] = useState(false);
  const [titulo, setTitulo] = useState(sessionSummary.titulo);
  const [numeroSesion, setNumeroSesion] = useState(String(sessionSummary.numero_sesion));
  const [descripcion, setDescripcion] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [busy, setBusy] = useState<null | "load" | "save" | "delete">(null);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setBusy("load");
    setError(null);
    try {
      const d = await api.getSession(token, sessionSummary.id);
      setDetail(d);
      setTitulo(d.titulo);
      setNumeroSesion(String(d.numero_sesion));
      setDescripcion(d.descripcion ?? "");
      setEmbedUrl(d.embed_url ?? "");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(null);
    }
  }, [token, sessionSummary.id]);

  async function toggleExpand() {
    const next = !expanded;
    setExpanded(next);
    if (next && !detail) await loadDetail();
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("save");
    setError(null);
    try {
      await api.adminUpdateSession(token, sessionSummary.id, {
        numero_sesion: Number(numeroSesion),
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        embed_url: embedUrl.trim() || null,
      });
      await loadDetail();
      await onChanged();
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar la sesión "${sessionSummary.titulo}" y todos sus adjuntos?`)) return;
    setBusy("delete");
    setError(null);
    try {
      await api.adminDeleteSession(token, sessionSummary.id);
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
      setBusy(null);
    }
  }

  return (
    <div className="rounded-md border border-surface-border bg-surface p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button onClick={toggleExpand} className="min-w-0 text-left flex-1">
          <p className="text-sm text-white truncate">
            <span className="text-neutral-500">#{sessionSummary.numero_sesion}</span>{" "}
            {sessionSummary.titulo}
          </p>
        </button>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={toggleExpand}
            className="rounded-md border border-surface-border hover:bg-neutral-800 px-2.5 py-1 text-xs text-neutral-300"
          >
            {expanded ? "Ocultar" : "Ver"}
          </button>
          <button
            onClick={handleDelete}
            disabled={busy !== null}
            className="rounded-md border border-red-800 hover:bg-red-950/40 disabled:opacity-50 px-2.5 py-1 text-xs text-red-300"
          >
            {busy === "delete" ? "…" : "Eliminar"}
          </button>
        </div>
      </div>

      {expanded &&
        (busy === "load" && !detail ? (
          <p className="text-xs text-neutral-500">Cargando…</p>
        ) : detail ? (
          <div className="space-y-3 border-t border-surface-border/60 pt-3">
            {editing ? (
              <form onSubmit={save} className="space-y-2">
                <NumberTitleFields
                  numeroLabel="Número"
                  numero={numeroSesion}
                  onNumeroChange={setNumeroSesion}
                  tituloLabel="Título"
                  titulo={titulo}
                  onTituloChange={setTitulo}
                />
                <DescriptionField value={descripcion} onChange={setDescripcion} />
                <EmbedUrlField value={embedUrl} onChange={setEmbedUrl} />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={busy !== null}
                    className="rounded-md bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    {busy === "save" ? "Guardando…" : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    disabled={busy !== null}
                    className="rounded-md border border-surface-border hover:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-neutral-300 whitespace-pre-wrap">
                  {detail.descripcion || <span className="text-neutral-500">Sin descripción.</span>}
                </p>
                {detail.embed_url && (
                  <p className="text-xs text-neutral-500 truncate">
                    Embed: <code className="text-neutral-400">{detail.embed_url}</code>
                  </p>
                )}
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md border border-surface-border hover:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300"
                >
                  Editar
                </button>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-widest text-neutral-500">Adjuntos</p>
              <AttachmentsPanel session={detail} token={token} onChanged={loadDetail} />
            </div>
          </div>
        ) : null)}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function NewSessionForm({
  moduleId,
  token,
  onCreated,
}: {
  moduleId: number;
  token: string;
  onCreated: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [numeroSesion, setNumeroSesion] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.adminCreateSession(token, moduleId, {
        numero_sesion: Number(numeroSesion),
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        embed_url: embedUrl.trim() || null,
      });
      setNumeroSesion("");
      setTitulo("");
      setDescripcion("");
      setEmbedUrl("");
      setOpen(false);
      await onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-dashed border-surface-border hover:border-ibero-red hover:text-ibero-red px-4 py-2 text-sm text-neutral-400 transition-colors w-full text-center"
      >
        + Nueva sesión
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-md border border-ibero-red/50 bg-surface p-4 space-y-3"
    >
      <NumberTitleFields
        numeroLabel="Número"
        numero={numeroSesion}
        onNumeroChange={setNumeroSesion}
        tituloLabel="Título"
        titulo={titulo}
        onTituloChange={setTitulo}
      />
      <DescriptionField value={descripcion} onChange={setDescripcion} />
      <EmbedUrlField value={embedUrl} onChange={setEmbedUrl} />
      {error && (
        <p className="text-xs text-red-300 border border-red-800 bg-red-950/40 rounded-md p-2">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 px-4 py-1.5 text-xs font-medium transition-colors"
        >
          {busy ? "Creando…" : "Crear sesión"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={busy}
          className="rounded-md border border-surface-border hover:bg-neutral-800 px-4 py-1.5 text-xs text-neutral-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Módulos
// ---------------------------------------------------------------------------

function ModuleCard({
  module,
  token,
  expanded,
  onToggleExpand,
  onChanged,
}: {
  module: ModuleOut;
  token: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onChanged: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [numero, setNumero] = useState(String(module.numero));
  const [nombre, setNombre] = useState(module.nombre);

  async function handleToggleLock() {
    setBusy(true);
    setError(null);
    try {
      if (module.unlocked_at) {
        await api.adminLockModule(token, module.id);
      } else {
        await api.adminUnlockModule(token, module.id);
      }
      await onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(false);
    }
  }

  function startEditing() {
    setNumero(String(module.numero));
    setNombre(module.nombre);
    setError(null);
    setEditing(true);
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.adminUpdateModule(token, module.id, { numero: Number(numero), nombre: nombre.trim() });
      await onChanged();
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-surface-border bg-surface-raised p-4 space-y-3">
      {editing ? (
        <form onSubmit={save} className="space-y-2">
          <NumberTitleFields
            numeroLabel="Número"
            numero={numero}
            onNumeroChange={setNumero}
            tituloLabel="Nombre"
            titulo={nombre}
            onTituloChange={setNombre}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white"
            >
              {busy ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={busy}
              className="rounded-md border border-surface-border hover:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={onToggleExpand} className="min-w-0 text-left">
            <p className="text-base font-semibold text-white">
              Módulo {module.numero} · {module.nombre}
            </p>
            <p className="text-xs text-neutral-500">
              {module.sessions.length} sesión(es) ·{" "}
              {module.unlocked_at ? "Desbloqueado" : "Bloqueado"}
            </p>
          </button>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={startEditing}
              className="rounded-md border border-surface-border hover:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300"
            >
              Editar
            </button>
            <button
              onClick={handleToggleLock}
              disabled={busy}
              className="rounded-md border border-surface-border hover:bg-neutral-800 disabled:opacity-50 px-3 py-1.5 text-xs text-neutral-300"
            >
              {busy ? "…" : module.unlocked_at ? "Bloquear" : "Desbloquear"}
            </button>
            <button
              onClick={onToggleExpand}
              className="rounded-md border border-surface-border hover:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300"
            >
              {expanded ? "Ocultar sesiones" : "Ver sesiones"}
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {expanded && (
        <div className="space-y-2 border-t border-surface-border/60 pt-3">
          {module.sessions.length === 0 ? (
            <p className="text-xs text-neutral-500">Este módulo aún no tiene sesiones.</p>
          ) : (
            module.sessions.map((s) => (
              <SessionRow key={s.id} sessionSummary={s} token={token} onChanged={onChanged} />
            ))
          )}
          <NewSessionForm moduleId={module.id} token={token} onCreated={onChanged} />
        </div>
      )}
    </div>
  );
}

function NewModuleForm({
  token,
  onCreated,
}: {
  token: string;
  onCreated: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [numero, setNumero] = useState("");
  const [nombre, setNombre] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.adminCreateModule(token, { numero: Number(numero), nombre: nombre.trim() });
      setNumero("");
      setNombre("");
      setOpen(false);
      await onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-dashed border-surface-border hover:border-ibero-red hover:text-ibero-red px-4 py-2 text-sm text-neutral-400 transition-colors w-full text-center"
      >
        + Nuevo módulo
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-md border border-ibero-red/50 bg-surface p-4 space-y-3"
    >
      <NumberTitleFields
        numeroLabel="Número"
        numero={numero}
        onNumeroChange={setNumero}
        tituloLabel="Nombre"
        titulo={nombre}
        onTituloChange={setNombre}
      />
      {error && (
        <p className="text-xs text-red-300 border border-red-800 bg-red-950/40 rounded-md p-2">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 px-4 py-1.5 text-xs font-medium transition-colors"
        >
          {busy ? "Creando…" : "Crear módulo"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={busy}
          className="rounded-md border border-surface-border hover:bg-neutral-800 px-4 py-1.5 text-xs text-neutral-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function AdminContenidoPage() {
  const authState = useAuth({ requireAdmin: true });
  const token = authState.status === "authenticated" ? authState.token : null;

  const [modules, setModules] = useState<ModuleOut[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setModules(await api.adminListModules(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) reload();
  }, [token, reload]);

  if (authState.status !== "authenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <header className="space-y-1">
        <Link href="/inicio" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Regresar al inicio
        </Link>
        <h1 className="text-3xl font-semibold">Admin · Contenido</h1>
        <p className="text-neutral-400 text-sm">
          Módulos, sesiones y adjuntos (PDF/PPTX/Word/imágenes) de la clase.
        </p>
      </header>

      {error && (
        <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <NewModuleForm token={token!} onCreated={reload} />

      {loading && modules.length === 0 ? (
        // Solo gatea la carga inicial — un reload tras editar/mover algo NO
        // debe desmontar la lista, o se pierde el estado local (sesiones
        // expandidas, ediciones en curso) de cada ModuleCard/SessionRow.
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : modules.length === 0 ? (
        <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
          Aún no hay módulos. Crea el primero arriba.
        </p>
      ) : (
        <div className="space-y-4">
          {modules.map((m) => (
            <ModuleCard
              key={m.id}
              module={m}
              token={token!}
              expanded={expanded.has(m.id)}
              onToggleExpand={() => toggleSet(expanded, setExpanded, m.id)}
              onChanged={reload}
            />
          ))}
        </div>
      )}
    </main>
  );
}
