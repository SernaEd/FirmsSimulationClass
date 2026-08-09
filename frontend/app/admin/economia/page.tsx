"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiError,
  CATEGORY_ORDER,
  DecimalRedemptionOut,
  PrivilegeCatalogIn,
  PrivilegeCatalogOut,
  PrivilegeCatalogUpdate,
  SeedResult,
  TicketOut,
  UserOut,
  api,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

// ---------------------------------------------------------------------------
// Catálogo de privilegios (CRUD)
// ---------------------------------------------------------------------------

type CatalogFormValues = {
  nombre: string;
  descripcion: string;
  categoria: string;
  costo: string;
  es_grupal: boolean;
  visible: boolean;
  feature_flag_key: string;
  limites_config: string; // JSON crudo, ej. {"por_semestre": 2}
};

function entryToFormValues(entry: PrivilegeCatalogOut): CatalogFormValues {
  return {
    nombre: entry.nombre,
    descripcion: entry.descripcion ?? "",
    categoria: entry.categoria ?? "",
    costo: String(entry.costo),
    es_grupal: entry.es_grupal,
    visible: entry.visible,
    feature_flag_key: entry.feature_flag_key ?? "",
    limites_config: entry.limites_config
      ? JSON.stringify(entry.limites_config)
      : "",
  };
}

const emptyFormValues: CatalogFormValues = {
  nombre: "",
  descripcion: "",
  categoria: "",
  costo: "",
  es_grupal: false,
  visible: true,
  feature_flag_key: "",
  limites_config: "",
};

/** Convierte el formulario a payload; lanza Error si el JSON de límites es
 * inválido o el costo no es un entero positivo (validación local antes de
 * llamar al backend, que valida de nuevo de todas formas). */
function formValuesToPayload(v: CatalogFormValues): PrivilegeCatalogIn {
  const costo = Number(v.costo);
  if (!Number.isInteger(costo) || costo < 1) {
    throw new Error("El costo debe ser un entero mayor o igual a 1.");
  }
  let limites_config: Record<string, number> | null = null;
  if (v.limites_config.trim()) {
    try {
      const parsed = JSON.parse(v.limites_config);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error();
      }
      limites_config = parsed;
    } catch {
      throw new Error(
        'Límites debe ser JSON válido, ej. {"por_semestre": 2}. Déjalo vacío si no aplica.',
      );
    }
  }
  return {
    nombre: v.nombre.trim(),
    descripcion: v.descripcion.trim() || null,
    categoria: v.categoria.trim() || null,
    costo,
    es_grupal: v.es_grupal,
    visible: v.visible,
    feature_flag_key: v.feature_flag_key.trim() || null,
    limites_config,
  };
}

function CatalogFormFields({
  values,
  onChange,
}: {
  values: CatalogFormValues;
  onChange: (v: CatalogFormValues) => void;
}) {
  function set<K extends keyof CatalogFormValues>(key: K, val: CatalogFormValues[K]) {
    onChange({ ...values, [key]: val });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Nombre</span>
          <input
            value={values.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            required
            minLength={3}
            maxLength={120}
            className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Costo (Tks)</span>
          <input
            type="number"
            min={1}
            step={1}
            value={values.costo}
            onChange={(e) => set("costo", e.target.value)}
            required
            className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white tabular-nums focus:border-ibero-red focus:outline-none"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-neutral-300">Descripción (opcional)</span>
        <input
          value={values.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Categoría</span>
          <input
            value={values.categoria}
            onChange={(e) => set("categoria", e.target.value)}
            list="categoria-options"
            placeholder="ej. tarea"
            className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
          />
          <datalist id="categoria-options">
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">
            Feature flag (opcional)
          </span>
          <input
            value={values.feature_flag_key}
            onChange={(e) => set("feature_flag_key", e.target.value)}
            placeholder="ej. ai_in_exam_enabled"
            className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-neutral-300">
          Límites (JSON, opcional)
        </span>
        <input
          value={values.limites_config}
          onChange={(e) => set("limites_config", e.target.value)}
          placeholder='{"por_semestre": 2}'
          className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white font-mono focus:border-ibero-red focus:outline-none"
        />
      </label>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={values.es_grupal}
            onChange={(e) => set("es_grupal", e.target.checked)}
            className="h-4 w-4 accent-ibero-red"
          />
          Grupal (Split Bill)
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={values.visible}
            onChange={(e) => set("visible", e.target.checked)}
            className="h-4 w-4 accent-ibero-red"
          />
          Visible al alumnado
        </label>
      </div>
    </div>
  );
}

function NewCatalogEntryForm({
  onCreate,
}: {
  onCreate: (payload: PrivilegeCatalogIn) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CatalogFormValues>(emptyFormValues);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = formValuesToPayload(values);
      await onCreate(payload);
      setValues(emptyFormValues);
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : String(err),
      );
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
        + Nuevo privilegio
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-md border border-ibero-red/50 bg-surface p-4 space-y-3"
    >
      <p className="text-sm font-semibold text-white">Nuevo privilegio</p>
      <CatalogFormFields values={values} onChange={setValues} />
      {error && (
        <p className="text-xs text-red-300 border border-red-800 bg-red-950/40 rounded-md p-2">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-ibero-red hover:bg-ibero-red-dark disabled:opacity-50 px-4 py-1.5 text-xs font-medium text-white transition-colors"
        >
          {busy ? "Creando…" : "Crear privilegio"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setValues(emptyFormValues);
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

function CatalogRow({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: PrivilegeCatalogOut;
  onUpdate: (id: number, payload: PrivilegeCatalogUpdate) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<CatalogFormValues>(entryToFormValues(entry));
  const [busy, setBusy] = useState<null | "save" | "toggle" | "delete">(null);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy("save");
    try {
      const payload = formValuesToPayload(values);
      await onUpdate(entry.id, payload);
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : String(err),
      );
    } finally {
      setBusy(null);
    }
  }

  async function toggleVisible() {
    setError(null);
    setBusy("toggle");
    try {
      await onUpdate(entry.id, { visible: !entry.visible });
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        `¿Eliminar "${entry.nombre}" del catálogo? Si ya tiene tickets emitidos, el sistema lo rechazará y sugerirá ocultarlo en su lugar.`,
      )
    )
      return;
    setError(null);
    setBusy("delete");
    try {
      await onDelete(entry.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
      setBusy(null);
    }
  }

  if (editing) {
    return (
      <form
        onSubmit={save}
        className="rounded-md border border-ibero-red/50 bg-surface p-4 space-y-3"
      >
        <CatalogFormFields values={values} onChange={setValues} />
        {error && (
          <p className="text-xs text-red-300 border border-red-800 bg-red-950/40 rounded-md p-2">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy !== null}
            className="rounded-md bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-4 py-1.5 text-xs font-medium text-white transition-colors"
          >
            {busy === "save" ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValues(entryToFormValues(entry));
              setError(null);
            }}
            disabled={busy !== null}
            className="rounded-md border border-surface-border hover:bg-neutral-800 px-4 py-1.5 text-xs text-neutral-300"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={
        "rounded-md border p-4 space-y-1 " +
        (entry.visible
          ? "border-surface-border bg-surface"
          : "border-surface-border/50 bg-surface/50 opacity-60")
      }
    >
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white flex items-center gap-2 flex-wrap">
            {entry.nombre}
            {!entry.visible && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                Oculto
              </span>
            )}
            {entry.es_grupal && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-950/50 border border-blue-800/60 text-blue-300">
                Grupal
              </span>
            )}
            {entry.feature_flag_key && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-800/60 text-amber-300">
                Flag: {entry.feature_flag_key}
              </span>
            )}
          </p>
          {entry.descripcion && (
            <p className="text-xs text-neutral-400 mt-0.5">{entry.descripcion}</p>
          )}
          <p className="text-xs text-neutral-500 mt-0.5">
            {entry.categoria ?? "sin categoría"}
            {entry.limites_config &&
              ` · límites: ${JSON.stringify(entry.limites_config)}`}
          </p>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <p className="text-lg font-semibold tabular-nums text-white mr-2">
            {entry.costo}
            <span className="text-xs font-normal text-neutral-400 ml-1">Tks</span>
          </p>
          <button
            onClick={() => setEditing(true)}
            disabled={busy !== null}
            className="rounded-md border border-surface-border hover:bg-neutral-800 disabled:opacity-50 px-3 py-1.5 text-xs text-neutral-300"
          >
            Editar
          </button>
          <button
            onClick={toggleVisible}
            disabled={busy !== null}
            className="rounded-md border border-surface-border hover:bg-neutral-800 disabled:opacity-50 px-3 py-1.5 text-xs text-neutral-300"
          >
            {busy === "toggle" ? "…" : entry.visible ? "Ocultar" : "Mostrar"}
          </button>
          <button
            onClick={handleDelete}
            disabled={busy !== null}
            className="rounded-md border border-red-800 hover:bg-red-950/40 disabled:opacity-50 px-3 py-1.5 text-xs text-red-300"
          >
            {busy === "delete" ? "…" : "Eliminar"}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}

function CatalogSection({
  entries,
  onCreate,
  onUpdate,
  onDelete,
  onSeed,
}: {
  entries: PrivilegeCatalogOut[];
  onCreate: (payload: PrivilegeCatalogIn) => Promise<void>;
  onUpdate: (id: number, payload: PrivilegeCatalogUpdate) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onSeed: () => Promise<SeedResult>;
}) {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  async function handleSeed() {
    setSeeding(true);
    setSeedError(null);
    setSeedResult(null);
    try {
      const result = await onSeed();
      setSeedResult(result);
    } catch (err) {
      setSeedError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setSeeding(false);
    }
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    categoria: cat,
    items: entries.filter((e) => e.categoria === cat),
  })).filter((g) => g.items.length > 0);
  const sinCategoria = entries.filter(
    (e) => !e.categoria || !CATEGORY_ORDER.includes(e.categoria),
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-surface-border pb-2 flex-wrap gap-2">
        <h2 className="text-lg font-semibold">
          Catálogo de privilegios ({entries.length})
        </h2>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="rounded-md border border-surface-border hover:bg-neutral-800 disabled:opacity-50 px-3 py-1.5 text-xs text-neutral-300"
        >
          {seeding ? "Sembrando…" : "Sembrar catálogo por defecto"}
        </button>
      </div>

      {seedResult && (
        <p className="text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-800/60 rounded-md p-2">
          {seedResult.creadas} creado(s), {seedResult.ya_existentes} ya existían.
        </p>
      )}
      {seedError && (
        <p className="text-xs text-red-300 bg-red-950/40 border border-red-800 rounded-md p-2">
          {seedError}
        </p>
      )}

      <NewCatalogEntryForm onCreate={onCreate} />

      {entries.length === 0 ? (
        <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
          El catálogo está vacío. Usa &ldquo;Sembrar catálogo por defecto&rdquo; para
          cargar los privilegios estándar, o crea uno nuevo.
        </p>
      ) : (
        <div className="space-y-5">
          {grouped.map((g) => (
            <div key={g.categoria} className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-neutral-500">
                {g.categoria}
              </p>
              <div className="grid gap-2">
                {g.items.map((entry) => (
                  <CatalogRow
                    key={entry.id}
                    entry={entry}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          ))}
          {sinCategoria.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-neutral-500">
                Otras
              </p>
              <div className="grid gap-2">
                {sinCategoria.map((entry) => (
                  <CatalogRow
                    key={entry.id}
                    entry={entry}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function TicketRow({
  ticket,
  onConsume,
  onCancel,
}: {
  ticket: TicketOut;
  onConsume: (folio: string) => Promise<void>;
  onCancel: (ticketId: number) => Promise<void>;
}) {
  const [busy, setBusy] = useState<null | "consume" | "cancel">(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleConsume() {
    setBusy("consume");
    setLocalError(null);
    try {
      await onConsume(ticket.folio);
    } catch (err) {
      setLocalError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel() {
    if (!confirm("¿Seguro que deseas cancelar este ticket y reembolsar el saldo? Esta acción no se puede deshacer.")) return;
    setBusy("cancel");
    setLocalError(null);
    try {
      await onCancel(ticket.id);
    } catch (err) {
      setLocalError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-md border border-surface-border bg-surface p-4 space-y-2">
      <div className="flex justify-between gap-4 flex-wrap">
        <div>
          <p className="text-lg font-mono tracking-wider font-bold text-white">
            {ticket.folio}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {ticket.catalog_name ?? `Privilegio #${ticket.catalog_id}`} · Creado: {new Date(ticket.created_at).toLocaleDateString("es-MX")}
          </p>
          <p className="text-xs text-neutral-500">
            Iniciado por: {ticket.initiator_name ?? `Usuario #${ticket.initiator_user_id}`}
            {ticket.team_id && ` · Equipo #${ticket.team_id}`}
          </p>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          <button
            onClick={handleConsume}
            disabled={busy !== null}
            className="rounded-md bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white transition-colors"
          >
            {busy === "consume" ? "Procesando…" : "Marcar Usado"}
          </button>
          <button
            onClick={handleCancel}
            disabled={busy !== null}
            className="rounded-md border border-red-800 hover:bg-red-950/40 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors"
          >
            {busy === "cancel" ? "Procesando…" : "Reembolsar"}
          </button>
        </div>
      </div>
      {localError && (
        <p className="text-xs text-red-400 mt-2">{localError}</p>
      )}
    </div>
  );
}

function DecimalRow({
  req,
  onResolve,
}: {
  req: DecimalRedemptionOut;
  onResolve: (id: number, approve: boolean, note?: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState<null | "approve" | "reject">(null);
  const [nota, setNota] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleResolve(approve: boolean) {
    setBusy(approve ? "approve" : "reject");
    setLocalError(null);
    try {
      await onResolve(req.id, approve, nota.trim() || undefined);
    } catch (err) {
      setLocalError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-md border border-surface-border bg-surface p-4 space-y-3">
      <div className="flex justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">
            {req.entrega_descripcion}
          </p>
          {req.entrega_ref && (
            <a
              href={req.entrega_ref.startsWith("http") ? req.entrega_ref : `https://${req.entrega_ref}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-400 hover:underline block"
            >
              Ver entrega / ref
            </a>
          )}
          <p className="text-xs text-neutral-400 mt-1">
            {req.user_name ?? `Usuario #${req.user_id}`} · Costo: {req.pts_costo} Tks
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-amber-200">
            +{req.decimas_solicitadas} décimas
          </p>
          <p className="text-[10px] text-neutral-500">
            Fecha: {new Date(req.created_at).toLocaleDateString("es-MX")}
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-surface-border/50">
        <input
          type="text"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Nota para el alumno (opcional)..."
          className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:border-ibero-red focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            onClick={() => handleResolve(true)}
            disabled={busy !== null}
            className="flex-1 rounded-md bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-white transition-colors"
          >
            {busy === "approve" ? "Procesando…" : "Aprobar"}
          </button>
          <button
            onClick={() => handleResolve(false)}
            disabled={busy !== null}
            className="flex-1 rounded-md border border-red-800 hover:bg-red-950/40 disabled:opacity-50 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors"
          >
            {busy === "reject" ? "Procesando…" : "Rechazar (Reembolsar)"}
          </button>
        </div>
        {localError && (
          <p className="text-xs text-red-400 text-center">{localError}</p>
        )}
      </div>
    </div>
  );
}

export default function AdminEconomiaPage() {
  const authState = useAuth();
  const token = authState.status === "authenticated" ? authState.token : null;

  const [catalog, setCatalog] = useState<PrivilegeCatalogOut[]>([]);
  const [tickets, setTickets] = useState<TicketOut[]>([]);
  const [decimals, setDecimals] = useState<DecimalRedemptionOut[]>([]);
  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [cList, tList, dList, uList] = await Promise.all([
        api.adminListPrivileges(token),
        api.adminListTickets(token, ["emitted"]),
        api.adminListPendingDecimals(token),
        api.adminListUsers(token),
      ]);
      setCatalog(cList);
      setTickets(tList);
      setDecimals(dList);
      setUsers(uList);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : String(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  async function reloadCatalogOnly() {
    if (!token) return;
    setCatalog(await api.adminListPrivileges(token));
  }

  useEffect(() => {
    if (token) loadData();
  }, [token, loadData]);

  if (authState.status === "loading") {
    return <div className="p-8 text-neutral-500">Cargando sesión…</div>;
  }
  if (authState.status === "error") {
    return <div className="p-8 text-red-400">Error: {authState.error}</div>;
  }
  if (!authState.user.is_admin) {
    return <div className="p-8 text-red-400">No tienes acceso de administrador.</div>;
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24 space-y-8">
      <header className="space-y-1 mt-4">
        <Link href="/inicio" className="text-sm text-neutral-400 hover:text-white">
          ← Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ibero-red pt-4">
          Admin · Economía
        </h1>
        <p className="text-sm text-neutral-400">
          Configura el catálogo, modera los tickets emitidos y aprueba canjes
          por décimas.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando datos…</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <div className="space-y-8">
          {/* SECCIÓN 0: CATÁLOGO */}
          <CatalogSection
            entries={catalog}
            onCreate={async (payload) => {
              await api.adminCreatePrivilege(token!, payload);
              await reloadCatalogOnly();
            }}
            onUpdate={async (id, payload) => {
              await api.adminUpdatePrivilege(token!, id, payload);
              await reloadCatalogOnly();
            }}
            onDelete={async (id) => {
              await api.adminDeletePrivilege(token!, id);
              await reloadCatalogOnly();
            }}
            onSeed={async () => {
              const result = await api.adminSeedDefaults(token!);
              await reloadCatalogOnly();
              return result;
            }}
          />

          {/* SECCIÓN 1: TICKETS */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface-border pb-2">
              Privilegios Físicos (Tickets Emitidos)
            </h2>
            {tickets.length === 0 ? (
              <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
                No hay tickets pendientes de uso en este momento.
              </p>
            ) : (
              <div className="grid gap-3">
                {tickets.map((t) => (
                  <TicketRow
                    key={t.id}
                    ticket={t}
                    onConsume={async (folio) => {
                      await api.adminConsumeTicket(token!, folio);
                      await loadData();
                    }}
                    onCancel={async (id) => {
                      await api.adminCancelTicket(token!, id);
                      await loadData();
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* SECCIÓN 2: DÉCIMAS */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface-border pb-2">
              Solicitudes de Décimas
            </h2>
            {decimals.length === 0 ? (
              <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
                No hay solicitudes pendientes.
              </p>
            ) : (
              <div className="grid gap-3">
                {decimals.map((req) => (
                  <DecimalRow
                    key={req.id}
                    req={req}
                    onResolve={async (id, approve, nota) => {
                      if (approve) {
                        await api.adminApproveDecimal(token!, id, nota);
                      } else {
                        await api.adminRejectDecimal(token!, id, nota);
                      }
                      await loadData();
                    }}
                  />
                ))}
              </div>
            )}
          </section>
          {/* SECCIÓN 3: AJUSTE MANUAL */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b border-surface-border pb-2">
              Ajuste Manual de Tokens
            </h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const userId = Number(formData.get("userId"));
                const delta = Number(formData.get("delta"));
                const nota = String(formData.get("nota"));

                if (!userId || !delta || !nota.trim()) {
                  alert("Todos los campos son obligatorios. Delta no puede ser cero.");
                  return;
                }

                try {
                  await api.adminAdjustTokens(token!, { user_id: userId, delta, nota });
                  alert("Ajuste realizado con éxito.");
                  e.currentTarget.reset();
                } catch (err) {
                  alert(err instanceof ApiError ? err.detail : String(err));
                }
              }}
              className="rounded-md border border-surface-border bg-surface p-4 space-y-3"
            >
              <div className="flex gap-4">
                <label className="flex-1 space-y-1">
                  <span className="text-xs font-medium text-neutral-300">Alumno</span>
                  <select
                    name="userId"
                    required
                    className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Selecciona un alumno...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} {u.apellidos} ({u.nickname})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex-1 space-y-1">
                  <span className="text-xs font-medium text-neutral-300">Monto (Tokens)</span>
                  <input
                    name="delta"
                    type="number"
                    required
                    className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
                    placeholder="Ej. 10 o -5"
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-neutral-300">Nota (Obligatoria)</span>
                <input
                  name="nota"
                  type="text"
                  required
                  className="w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none"
                  placeholder="Motivo del ajuste..."
                />
              </label>
              <button
                type="submit"
                className="rounded-md bg-white text-black hover:bg-neutral-200 px-4 py-2 text-sm font-medium transition-colors"
              >
                Aplicar Ajuste
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
