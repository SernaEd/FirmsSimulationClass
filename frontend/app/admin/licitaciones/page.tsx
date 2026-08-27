"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApiError,
  CasoAdminOut,
  CasoIn,
  CasoUpdate,
  LicitacionAbrirIn,
  LicitacionOut,
  LicitacionResponseOut,
  api,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

function formatError(err: unknown): string {
  if (err instanceof ApiError) return err.detail;
  if (err instanceof Error) return err.message;
  return String(err);
}

// ---------------------------------------------------------------------------
// Banco de casos (CRUD) — no hay endpoint de borrado: un caso ya usado en
// una licitación no debe poder desaparecer y romper su historial.
// ---------------------------------------------------------------------------

type CasoFormValues = {
  numero: string;
  titulo: string;
  modulo: string;
  contexto: string;
  volumen_l: string;
  concentracion_inicial: string;
  concentracion_max: string;
  plazo_horas: string;
  presion_max_q: string;
  dinero_perdido_mxn: string;
  pacientes_afectados: string;
  costo_reparacion_mxn: string;
};

const emptyCasoFormValues: CasoFormValues = {
  numero: "",
  titulo: "",
  modulo: "",
  contexto: "",
  volumen_l: "",
  concentracion_inicial: "",
  concentracion_max: "",
  plazo_horas: "",
  presion_max_q: "",
  dinero_perdido_mxn: "",
  pacientes_afectados: "",
  costo_reparacion_mxn: "",
};

function casoToFormValues(caso: CasoAdminOut): CasoFormValues {
  return {
    numero: String(caso.numero),
    titulo: caso.titulo,
    modulo: caso.modulo,
    contexto: caso.contexto,
    volumen_l: String(caso.volumen_l),
    concentracion_inicial: String(caso.concentracion_inicial),
    concentracion_max: String(caso.concentracion_max),
    plazo_horas: String(caso.plazo_horas),
    presion_max_q: String(caso.presion_max_q),
    dinero_perdido_mxn: String(caso.dinero_perdido_mxn),
    pacientes_afectados: String(caso.pacientes_afectados),
    costo_reparacion_mxn: String(caso.costo_reparacion_mxn),
  };
}

type NumericFieldKind = "float_gt0" | "float_ge0" | "int_ge0";

const NUMERIC_FIELD_SPECS: [string, keyof CasoFormValues, NumericFieldKind][] = [
  ["Volumen del tanque", "volumen_l", "float_gt0"],
  ["Concentración inicial", "concentracion_inicial", "float_gt0"],
  ["Concentración máxima permitida", "concentracion_max", "float_gt0"],
  ["Plazo", "plazo_horas", "float_gt0"],
  ["Presión máx. (Q)", "presion_max_q", "float_gt0"],
  ["Dinero perdido", "dinero_perdido_mxn", "float_ge0"],
  ["Costo de reparación", "costo_reparacion_mxn", "float_ge0"],
  ["Pacientes afectados", "pacientes_afectados", "int_ge0"],
];

const NUMERIC_FIELD_ERROR: Record<NumericFieldKind, string> = {
  float_gt0: "número mayor a 0",
  float_ge0: "número mayor o igual a 0",
  int_ge0: "entero mayor o igual a 0",
};

/** Convierte el formulario a payload; lanza Error si algún campo numérico
 * no cumple las restricciones del backend (validación local antes de
 * llamar a la API, que valida de nuevo de todas formas). */
function formValuesToCasoPayload(v: CasoFormValues): CasoIn {
  const numero = Number(v.numero);
  if (!Number.isInteger(numero) || numero < 1) {
    throw new Error("El número de caso debe ser un entero mayor o igual a 1.");
  }
  if (!v.titulo.trim() || !v.modulo.trim() || !v.contexto.trim()) {
    throw new Error("Título, módulo y contexto son obligatorios.");
  }
  const parsed: Record<string, number> = {};
  for (const [label, key, kind] of NUMERIC_FIELD_SPECS) {
    const n = Number(v[key]);
    const valid =
      kind === "int_ge0" ? Number.isInteger(n) && n >= 0
      : kind === "float_ge0" ? Number.isFinite(n) && n >= 0
      : Number.isFinite(n) && n > 0;
    if (!valid) {
      throw new Error(`${label} debe ser un ${NUMERIC_FIELD_ERROR[kind]}.`);
    }
    parsed[key] = n;
  }

  return {
    numero,
    titulo: v.titulo.trim(),
    modulo: v.modulo.trim(),
    contexto: v.contexto.trim(),
    tipo_modelo: "mezcla_lineal_tanque",
    volumen_l: parsed.volumen_l,
    concentracion_inicial: parsed.concentracion_inicial,
    concentracion_max: parsed.concentracion_max,
    plazo_horas: parsed.plazo_horas,
    presion_max_q: parsed.presion_max_q,
    dinero_perdido_mxn: parsed.dinero_perdido_mxn,
    pacientes_afectados: parsed.pacientes_afectados,
    costo_reparacion_mxn: parsed.costo_reparacion_mxn,
  };
}

function inputClass(mono?: boolean) {
  return (
    "w-full rounded-md border border-surface-border bg-neutral-900 px-3 py-1.5 text-sm text-white focus:border-ibero-red focus:outline-none" +
    (mono ? " tabular-nums" : "")
  );
}

function CasoFormFields({
  values,
  onChange,
}: {
  values: CasoFormValues;
  onChange: (v: CasoFormValues) => void;
}) {
  function set<K extends keyof CasoFormValues>(key: K, val: CasoFormValues[K]) {
    onChange({ ...values, [key]: val });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Número</span>
          <input
            type="number"
            min={1}
            step={1}
            value={values.numero}
            onChange={(e) => set("numero", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Título</span>
          <input
            value={values.titulo}
            onChange={(e) => set("titulo", e.target.value)}
            required
            maxLength={200}
            className={inputClass()}
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-neutral-300">Módulo</span>
        <input
          value={values.modulo}
          onChange={(e) => set("modulo", e.target.value)}
          required
          maxLength={200}
          placeholder="ej. Ecuaciones diferenciales de primer orden"
          className={inputClass()}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-neutral-300">Contexto (enunciado)</span>
        <textarea
          value={values.contexto}
          onChange={(e) => set("contexto", e.target.value)}
          required
          rows={3}
          className={inputClass()}
        />
      </label>

      <p className="text-xs uppercase tracking-widest text-neutral-500 pt-1">
        Parámetros del modelo
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Volumen del tanque (L)</span>
          <input
            type="number"
            step="any"
            min={0.01}
            value={values.volumen_l}
            onChange={(e) => set("volumen_l", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Concentración inicial (mg/L)</span>
          <input
            type="number"
            step="any"
            min={0.01}
            value={values.concentracion_inicial}
            onChange={(e) => set("concentracion_inicial", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Concentración máx. permitida (mg/L)</span>
          <input
            type="number"
            step="any"
            min={0.01}
            value={values.concentracion_max}
            onChange={(e) => set("concentracion_max", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Plazo (horas)</span>
          <input
            type="number"
            step="any"
            min={0.01}
            value={values.plazo_horas}
            onChange={(e) => set("plazo_horas", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
        <label className="col-span-2 space-y-1">
          <span className="text-xs font-medium text-neutral-300">Presión máx. — caudal Q (L/h)</span>
          <input
            type="number"
            step="any"
            min={0.01}
            value={values.presion_max_q}
            onChange={(e) => set("presion_max_q", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
      </div>

      <p className="text-xs uppercase tracking-widest text-neutral-500 pt-1">
        Consecuencias si el equipo falla
      </p>
      <div className="grid grid-cols-3 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Dinero perdido (MXN)</span>
          <input
            type="number"
            step="any"
            min={0}
            value={values.dinero_perdido_mxn}
            onChange={(e) => set("dinero_perdido_mxn", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Pacientes afectados</span>
          <input
            type="number"
            min={0}
            step={1}
            value={values.pacientes_afectados}
            onChange={(e) => set("pacientes_afectados", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Costo de reparación (MXN)</span>
          <input
            type="number"
            step="any"
            min={0}
            value={values.costo_reparacion_mxn}
            onChange={(e) => set("costo_reparacion_mxn", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
      </div>
    </div>
  );
}

function NewCasoForm({ onCreate }: { onCreate: (payload: CasoIn) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<CasoFormValues>(emptyCasoFormValues);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = formValuesToCasoPayload(values);
      await onCreate(payload);
      setValues(emptyCasoFormValues);
      setOpen(false);
    } catch (err) {
      setError(formatError(err));
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
        + Nuevo caso
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-ibero-red/50 bg-surface p-4 space-y-3">
      <p className="text-sm font-semibold text-white">Nuevo caso</p>
      <CasoFormFields values={values} onChange={setValues} />
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
          {busy ? "Creando…" : "Crear caso"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setValues(emptyCasoFormValues);
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

function CasoRow({
  caso,
  onUpdate,
}: {
  caso: CasoAdminOut;
  onUpdate: (id: number, payload: CasoUpdate) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<CasoFormValues>(casoToFormValues(caso));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = formValuesToCasoPayload(values);
      await onUpdate(caso.id, payload);
      setEditing(false);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <form onSubmit={save} className="rounded-md border border-ibero-red/50 bg-surface p-4 space-y-3">
        <CasoFormFields values={values} onChange={setValues} />
        {error && (
          <p className="text-xs text-red-300 border border-red-800 bg-red-950/40 rounded-md p-2">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 px-4 py-1.5 text-xs font-medium text-white transition-colors"
          >
            {busy ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setValues(casoToFormValues(caso));
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

  return (
    <div className="rounded-md border border-surface-border bg-surface p-4 space-y-1">
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">
            #{caso.numero} — {caso.titulo}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">{caso.modulo}</p>
          <p className="text-xs text-neutral-500 mt-1">
            V={caso.volumen_l} L · A₀={caso.concentracion_inicial} · A_max={caso.concentracion_max} ·
            plazo={caso.plazo_horas} h · Q_max={caso.presion_max_q} L/h
          </p>
          <p className="text-xs text-neutral-500">
            Si falla: ${caso.dinero_perdido_mxn.toLocaleString("es-MX")} MXN ·{" "}
            {caso.pacientes_afectados} paciente(s) · reparación $
            {caso.costo_reparacion_mxn.toLocaleString("es-MX")} MXN
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="rounded-md border border-surface-border hover:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 shrink-0"
        >
          Editar
        </button>
      </div>
    </div>
  );
}

function CasosSection({
  casos,
  onCreate,
  onUpdate,
}: {
  casos: CasoAdminOut[];
  onCreate: (payload: CasoIn) => Promise<void>;
  onUpdate: (id: number, payload: CasoUpdate) => Promise<void>;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold border-b border-surface-border pb-2">
        Banco de casos ({casos.length})
      </h2>
      <NewCasoForm onCreate={onCreate} />
      {casos.length === 0 ? (
        <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
          Aún no hay casos creados.
        </p>
      ) : (
        <div className="grid gap-2">
          {casos.map((c) => (
            <CasoRow key={c.id} caso={c} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Licitaciones — abrir / cerrar / revisar respuestas
// ---------------------------------------------------------------------------

const ESTADO_BADGE: Record<string, string> = {
  abierta: "bg-emerald-950/40 border border-emerald-800/60 text-emerald-300",
  cerrada: "bg-neutral-800/60 border border-neutral-700 text-neutral-400",
};

type AbrirFormValues = {
  caso_id: string;
  pts_primero: string;
  pts_segundo: string;
  pts_tercero: string;
  pts_correcta_fuera_podio: string;
  pts_participacion: string;
};

const defaultAbrirValues: AbrirFormValues = {
  caso_id: "",
  pts_primero: "40",
  pts_segundo: "25",
  pts_tercero: "18",
  pts_correcta_fuera_podio: "10",
  pts_participacion: "5",
};

function AbrirLicitacionForm({
  casos,
  onAbrir,
}: {
  casos: CasoAdminOut[];
  onAbrir: (payload: LicitacionAbrirIn) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<AbrirFormValues>(defaultAbrirValues);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AbrirFormValues>(key: K, val: AbrirFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const casoId = Number(values.caso_id);
    if (!casoId) {
      setError("Selecciona un caso.");
      return;
    }
    setBusy(true);
    try {
      await onAbrir({
        caso_id: casoId,
        pts_primero: Number(values.pts_primero),
        pts_segundo: Number(values.pts_segundo),
        pts_tercero: Number(values.pts_tercero),
        pts_correcta_fuera_podio: Number(values.pts_correcta_fuera_podio),
        pts_participacion: Number(values.pts_participacion),
      });
      setValues(defaultAbrirValues);
      setOpen(false);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setBusy(false);
    }
  }

  if (casos.length === 0) {
    return (
      <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
        Crea un caso en el banco de abajo antes de abrir una licitación.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-dashed border-surface-border hover:border-ibero-red hover:text-ibero-red px-4 py-2 text-sm text-neutral-400 transition-colors w-full text-center"
      >
        + Abrir nueva licitación
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-ibero-red/50 bg-surface p-4 space-y-3">
      <p className="text-sm font-semibold text-white">Abrir nueva licitación</p>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-neutral-300">Caso</span>
        <select
          value={values.caso_id}
          onChange={(e) => set("caso_id", e.target.value)}
          required
          className={inputClass()}
        >
          <option value="" disabled>
            Selecciona un caso…
          </option>
          {casos.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.numero} — {c.titulo}
            </option>
          ))}
        </select>
      </label>

      <p className="text-xs uppercase tracking-widest text-neutral-500 pt-1">
        Puntos (Tokens) por resultado
      </p>
      <div className="grid grid-cols-3 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">1er lugar</span>
          <input
            type="number"
            min={0}
            step={1}
            value={values.pts_primero}
            onChange={(e) => set("pts_primero", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">2do lugar</span>
          <input
            type="number"
            min={0}
            step={1}
            value={values.pts_segundo}
            onChange={(e) => set("pts_segundo", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">3er lugar</span>
          <input
            type="number"
            min={0}
            step={1}
            value={values.pts_tercero}
            onChange={(e) => set("pts_tercero", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Correcta fuera de podio</span>
          <input
            type="number"
            min={0}
            step={1}
            value={values.pts_correcta_fuera_podio}
            onChange={(e) => set("pts_correcta_fuera_podio", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-neutral-300">Participación</span>
          <input
            type="number"
            min={0}
            step={1}
            value={values.pts_participacion}
            onChange={(e) => set("pts_participacion", e.target.value)}
            required
            className={inputClass(true)}
          />
        </label>
      </div>

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
          {busy ? "Abriendo…" : "Abrir licitación"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setValues(defaultAbrirValues);
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

function RespuestaRow({ respuesta }: { respuesta: LicitacionResponseOut }) {
  return (
    <li className="py-2 flex items-center justify-between gap-3 flex-wrap text-xs">
      <div className="min-w-0">
        <span className="text-white">Equipo #{respuesta.team_id}</span>{" "}
        <span className="text-neutral-500">· Q={respuesta.q_propuesta} L/h</span>
      </div>
      <div className="flex items-center gap-3 text-neutral-400 shrink-0">
        <span className={respuesta.correcta ? "text-emerald-300" : "text-red-300"}>
          {respuesta.correcta ? "Correcta" : "Incorrecta"}
        </span>
        {respuesta.orden_llegada && <span>lugar #{respuesta.orden_llegada}</span>}
        <span className="tabular-nums">{respuesta.puntos_tokens ?? "—"} Tks</span>
        <span>{new Date(respuesta.created_at).toLocaleString("es-MX")}</span>
      </div>
    </li>
  );
}

function LicitacionRow({
  licitacion,
  onCerrar,
  onFetchRespuestas,
  busy,
}: {
  licitacion: LicitacionOut;
  onCerrar: (id: number) => Promise<void>;
  onFetchRespuestas: (id: number) => Promise<LicitacionResponseOut[]>;
  busy: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [respuestas, setRespuestas] = useState<LicitacionResponseOut[] | null>(null);
  const [loadingResp, setLoadingResp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRespuestas = useCallback(async () => {
    setLoadingResp(true);
    setError(null);
    try {
      setRespuestas(await onFetchRespuestas(licitacion.id));
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoadingResp(false);
    }
  }, [licitacion.id, onFetchRespuestas]);

  async function toggleExpand() {
    if (!expanded && respuestas === null) {
      await fetchRespuestas();
    }
    setExpanded((v) => !v);
  }

  async function handleCerrar() {
    if (
      !confirm(
        `¿Cerrar la licitación del caso "${licitacion.caso.titulo}"? Se calculará el podio y se acreditarán Tokens a los equipos.`,
      )
    )
      return;
    setError(null);
    try {
      await onCerrar(licitacion.id);
      // Cerrar recalcula orden_llegada/puntos_tokens de cada respuesta en
      // el backend — si ya las teníamos cargadas mientras estaba abierta,
      // hay que refrescarlas para no seguir mostrando los puntos como
      // pendientes.
      if (expanded) await fetchRespuestas();
    } catch (err) {
      setError(formatError(err));
    }
  }

  return (
    <div className="rounded-md border border-surface-border bg-surface p-4 space-y-2">
      <div className="flex justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white flex items-center gap-2 flex-wrap">
            #{licitacion.caso.numero} — {licitacion.caso.titulo}
            <span
              className={
                "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded " +
                ESTADO_BADGE[licitacion.estado]
              }
            >
              {licitacion.estado}
            </span>
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            Puntos: {licitacion.pts_primero}/{licitacion.pts_segundo}/{licitacion.pts_tercero} ·
            fuera de podio {licitacion.pts_correcta_fuera_podio} · participación{" "}
            {licitacion.pts_participacion}
          </p>
          <p className="text-xs text-neutral-500">
            Abierta: {new Date(licitacion.abierta_at).toLocaleString("es-MX")}
            {licitacion.cerrada_at &&
              ` · Cerrada: ${new Date(licitacion.cerrada_at).toLocaleString("es-MX")}`}
          </p>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          {licitacion.estado === "abierta" && (
            <button
              onClick={handleCerrar}
              disabled={busy}
              className="rounded-md border border-red-800 hover:bg-red-950/40 disabled:opacity-50 px-3 py-1.5 text-xs text-red-300"
            >
              Cerrar
            </button>
          )}
          <button
            onClick={toggleExpand}
            className="rounded-md border border-surface-border hover:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300"
          >
            {expanded ? "Ocultar respuestas" : "Ver respuestas"}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {expanded && (
        <div className="border-t border-surface-border/60 pt-2">
          {loadingResp ? (
            <p className="text-xs text-neutral-500">Cargando respuestas…</p>
          ) : respuestas && respuestas.length > 0 ? (
            <ul className="divide-y divide-surface-border/40">
              {respuestas.map((r) => (
                <RespuestaRow key={r.id} respuesta={r} />
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral-500">Aún no hay respuestas de ningún equipo.</p>
          )}
        </div>
      )}
    </div>
  );
}

function LicitacionesSection({
  licitaciones,
  casos,
  onAbrir,
  onCerrar,
  onFetchRespuestas,
}: {
  licitaciones: LicitacionOut[];
  casos: CasoAdminOut[];
  onAbrir: (payload: LicitacionAbrirIn) => Promise<void>;
  onCerrar: (id: number) => Promise<void>;
  onFetchRespuestas: (id: number) => Promise<LicitacionResponseOut[]>;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const hayAbierta = licitaciones.some((l) => l.estado === "abierta");

  async function handleCerrar(id: number) {
    setBusyId(id);
    try {
      await onCerrar(id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold border-b border-surface-border pb-2">
        Licitaciones ({licitaciones.length})
      </h2>
      {hayAbierta ? (
        <p className="text-xs text-neutral-500 bg-surface rounded-md p-3 border border-surface-border">
          Ya hay una licitación abierta — ciérrala antes de abrir otra.
        </p>
      ) : (
        <AbrirLicitacionForm casos={casos} onAbrir={onAbrir} />
      )}
      {licitaciones.length === 0 ? (
        <p className="text-sm text-neutral-500 bg-surface rounded-md p-4 text-center border border-surface-border">
          Aún no se ha abierto ninguna licitación.
        </p>
      ) : (
        <div className="grid gap-2">
          {licitaciones.map((l) => (
            <LicitacionRow
              key={l.id}
              licitacion={l}
              onCerrar={handleCerrar}
              onFetchRespuestas={onFetchRespuestas}
              busy={busyId === l.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function AdminLicitacionesPage() {
  const authState = useAuth({ requireAdmin: true });
  const token = authState.status === "authenticated" ? authState.token : null;

  const [casos, setCasos] = useState<CasoAdminOut[]>([]);
  const [licitaciones, setLicitaciones] = useState<LicitacionOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [casosRes, licitacionesRes] = await Promise.all([
        api.adminListCasos(token),
        api.adminListLicitaciones(token),
      ]);
      setCasos(casosRes);
      setLicitaciones(licitacionesRes);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  async function reloadCasosOnly() {
    if (!token) return;
    setCasos(await api.adminListCasos(token));
  }

  async function reloadLicitacionesOnly() {
    if (!token) return;
    setLicitaciones(await api.adminListLicitaciones(token));
  }

  useEffect(() => {
    if (token) loadData();
  }, [token, loadData]);

  if (authState.status !== "authenticated") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-8 py-4 pb-24 space-y-8">
      <header className="space-y-1 mt-4">
        <Link href="/inicio" className="text-sm text-neutral-400 hover:text-white">
          ← Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ibero-red pt-4">
          Admin · Licitaciones
        </h1>
        <p className="text-sm text-neutral-400">
          Administra el banco de casos, abre la licitación de la sesión y revisa las
          respuestas de los equipos al cerrarla.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando datos…</p>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : (
        <div className="space-y-8">
          <LicitacionesSection
            licitaciones={licitaciones}
            casos={casos}
            onAbrir={async (payload) => {
              await api.adminAbrirLicitacion(token!, payload);
              await reloadLicitacionesOnly();
            }}
            onCerrar={async (id) => {
              await api.adminCerrarLicitacion(token!, id);
              await reloadLicitacionesOnly();
            }}
            onFetchRespuestas={(id) => api.adminListRespuestasLicitacion(token!, id)}
          />

          <CasosSection
            casos={casos}
            onCreate={async (payload) => {
              await api.adminCreateCaso(token!, payload);
              await reloadCasosOnly();
            }}
            onUpdate={async (id, payload) => {
              await api.adminUpdateCaso(token!, id, payload);
              await reloadCasosOnly();
            }}
          />
        </div>
      )}
    </main>
  );
}
