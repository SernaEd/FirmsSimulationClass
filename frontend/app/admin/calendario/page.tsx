"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  CalendarEventColor,
  CalendarEventOut,
  CalendarEventPayload,
  CalendarEventScope,
  CalendarEventTypeOut,
  CalendarEventTypePayload,
  StudentAdminOut,
  api,
} from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { CalendarGrid, CalendarView, eventColorClass, getVisibleRange } from "@/components/CalendarGrid";
import { TipoYTituloFields } from "@/components/CalendarEventFields";

const COLOR_OPTIONS: { value: CalendarEventColor; label: string }[] = [
  { value: "neutral", label: "Neutro" },
  { value: "accent", label: "Acento" },
  { value: "accent2", label: "Acento 2" },
  { value: "red", label: "Rojo" },
  { value: "amber", label: "Ámbar" },
  { value: "emerald", label: "Esmeralda" },
];

function errMessage(err: unknown): string {
  if (err instanceof ApiError) return err.detail;
  if (err instanceof Error) return err.message;
  return String(err);
}

export default function AdminCalendario() {
  const authState = useAuth({ requireAdmin: true });
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventOut[]>([]);
  const [eventTypes, setEventTypes] = useState<CalendarEventTypeOut[]>([]);
  const [students, setStudents] = useState<StudentAdminOut[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const range = useMemo(() => getVisibleRange(view, cursor), [view, cursor]);
  const token = authState.status === "authenticated" ? authState.token : null;

  const loadEvents = async () => {
    if (!token) return;
    try {
      setEvents(await api.adminListCalendarEvents(token, range.start, range.end));
    } catch (err) {
      setError(errMessage(err));
    }
  };

  const loadStatic = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [types, allStudents] = await Promise.all([
        api.adminListCalendarEventTypes(token),
        api.adminListAllStudents(token),
      ]);
      setEventTypes(types);
      setStudents(allStudents.filter((s) => s.estado === "active"));
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadStatic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (token) loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, range.start, range.end]);

  if (authState.status === "loading") return <p className="p-8 text-neutral-500">Cargando...</p>;
  if (authState.status === "error") return <p className="p-8 text-red-500">{authState.error}</p>;

  const dayEvents = selectedDate ? events.filter((e) => e.fecha === selectedDate) : [];

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8 space-y-1">
        <Link href="/inicio" className="text-sm text-neutral-400 hover:text-white">
          ← Volver al inicio
        </Link>
        <h1 className="text-2xl font-bold text-neutral-100 pt-4">Calendario académico</h1>
        <p className="text-sm text-neutral-400">
          Exámenes, entregas, licitaciones, descansos y excepciones (§11.5). Los eventos cuya categoría
          está marcada "cuenta como día neutro para la racha" hacen que ese día no rompa ni exija
          evidencia a nadie — lunes-jueves cuentan por diseño, viernes-domingo ya son neutros sin
          marcarlos.
        </p>
      </header>

      {error && <div className="bg-red-900/30 text-red-200 border border-red-800 p-4 rounded mb-6">{error}</div>}

      <CalendarGrid
        view={view}
        cursor={cursor}
        events={events}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onCursorChange={setCursor}
        onViewChange={setView}
      />

      {selectedDate && (
        <DayPanel
          fecha={selectedDate}
          events={dayEvents}
          eventTypes={eventTypes}
          students={students}
          onClose={() => setSelectedDate(null)}
          onCreate={async (payload) => {
            if (!token) return;
            await api.adminCreateCalendarEvent(token, payload);
            await loadEvents();
          }}
          onDelete={async (id) => {
            if (!token) return;
            await api.adminDeleteCalendarEvent(token, id);
            await loadEvents();
          }}
        />
      )}

      <EventTypesSection
        eventTypes={eventTypes}
        loading={loading}
        onCreate={async (payload) => {
          if (!token) return;
          const created = await api.adminCreateCalendarEventType(token, payload);
          setEventTypes((prev) => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        }}
        onUpdate={async (id, payload) => {
          if (!token) return;
          const updated = await api.adminUpdateCalendarEventType(token, id, payload);
          setEventTypes((prev) => prev.map((t) => (t.id === id ? updated : t)));
        }}
        onDelete={async (id) => {
          if (!token) return;
          await api.adminDeleteCalendarEventType(token, id);
          setEventTypes((prev) => prev.filter((t) => t.id !== id));
        }}
      />
    </main>
  );
}

function DayPanel({
  fecha,
  events,
  eventTypes,
  students,
  onClose,
  onCreate,
  onDelete,
}: {
  fecha: string;
  events: CalendarEventOut[];
  eventTypes: CalendarEventTypeOut[];
  students: StudentAdminOut[];
  onClose: () => void;
  onCreate: (payload: CalendarEventPayload) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [tipoId, setTipoId] = useState<number | "">("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [alcanceTipo, setAlcanceTipo] = useState<CalendarEventScope>("todos");
  const [alumnoIds, setAlumnoIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!tipoId) return;
    setFormError(null);
    setBusy(true);
    try {
      await onCreate({
        tipo_id: tipoId,
        fecha,
        titulo,
        descripcion: descripcion || null,
        alcance_tipo: alcanceTipo,
        alcance_ids: alcanceTipo === "alumno" ? alumnoIds : null,
      });
      setOpen(false);
      setTipoId("");
      setTitulo("");
      setDescripcion("");
      setAlcanceTipo("todos");
      setAlumnoIds([]);
    } catch (err) {
      setFormError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-md bg-surface-raised shadow-md p-6 mt-5 border border-accent-800/40">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-neutral-100">{fecha}</h2>
        <button onClick={onClose} className="text-xs text-neutral-500 hover:text-neutral-300">
          Cerrar ✕
        </button>
      </div>

      {events.length === 0 && !open && (
        <p className="text-sm text-neutral-500 mb-4">No hay eventos este día.</p>
      )}

      <ul className="space-y-2 mb-4">
        {events.map((ev) => (
          <li
            key={ev.id}
            className={`rounded-md border p-3 flex items-start justify-between gap-3 ${eventColorClass(ev.tipo.color)}`}
          >
            <div>
              <p className="text-sm font-medium">
                {ev.titulo} <span className="text-xs opacity-70">— {ev.tipo.nombre}</span>
              </p>
              {ev.descripcion && <p className="text-xs opacity-80 mt-0.5">{ev.descripcion}</p>}
              {ev.alcance_tipo === "alumno" && (
                <p className="text-xs opacity-70 mt-0.5">
                  Solo para {ev.alcance_ids?.length ?? 0} alumno(s) específico(s)
                </p>
              )}
            </div>
            <button
              onClick={() => onDelete(ev.id)}
              className="text-xs underline shrink-0 hover:opacity-80"
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-md border border-dashed border-surface-border hover:border-accent-500 hover:text-accent-400 px-4 py-2 text-sm text-neutral-400 transition-colors w-full text-center"
        >
          + Nuevo evento
        </button>
      ) : (
        <form onSubmit={submit} className="rounded-md border border-accent-500/50 bg-surface p-4 space-y-3">
          <TipoYTituloFields
            eventTypes={eventTypes}
            tipoId={tipoId}
            onTipoIdChange={setTipoId}
            titulo={titulo}
            onTituloChange={setTitulo}
          />
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Descripción (opcional)</label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-surface border-surface-border text-neutral-100 rounded-md p-2 border text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Alcance</label>
            <div className="flex gap-4 text-sm text-neutral-300 mb-2">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={alcanceTipo === "todos"}
                  onChange={() => setAlcanceTipo("todos")}
                />
                Todo el curso
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={alcanceTipo === "alumno"}
                  onChange={() => setAlcanceTipo("alumno")}
                />
                Alumno(s) específico(s)
              </label>
            </div>
            {alcanceTipo === "alumno" && (
              <select
                multiple
                required
                value={alumnoIds.map(String)}
                onChange={(e) =>
                  setAlumnoIds(Array.from(e.target.selectedOptions, (o) => Number(o.value)))
                }
                className="w-full bg-surface border-surface-border text-neutral-100 rounded-md p-2 border text-sm h-32"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} {s.apellidos} (@{s.nickname})
                  </option>
                ))}
              </select>
            )}
          </div>
          {formError && (
            <p className="text-xs text-red-300 border border-red-800 bg-red-950/40 rounded-md p-2">
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 px-4 py-1.5 text-xs font-medium transition-colors"
            >
              {busy ? "Creando..." : "Crear evento"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="rounded-md border border-surface-border hover:bg-neutral-800 px-4 py-1.5 text-xs text-neutral-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function EventTypesSection({
  eventTypes,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: {
  eventTypes: CalendarEventTypeOut[];
  loading: boolean;
  onCreate: (payload: CalendarEventTypePayload) => Promise<void>;
  onUpdate: (id: number, payload: Partial<CalendarEventTypePayload>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [color, setColor] = useState<CalendarEventColor>("neutral");
  const [afectaRacha, setAfectaRacha] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setBusy(true);
    try {
      await onCreate({ nombre, color, afecta_racha: afectaRacha });
      setOpen(false);
      setNombre("");
      setColor("neutral");
      setAfectaRacha(false);
    } catch (err) {
      setFormError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bg-surface-raised rounded-lg shadow p-6 mt-8 border border-surface-border">
      <h2 className="text-lg font-semibold text-neutral-100 mb-1">Tipos de evento</h2>
      <p className="text-sm text-neutral-400 mb-4">
        Categorías disponibles en el dropdown "Tipo de evento" — ej. Examen, Licitación, Descanso
        obligatorio, Entrega de tarea.
      </p>

      <ul className="space-y-2 mb-4">
        {loading ? (
          <p className="text-sm text-neutral-500">Cargando...</p>
        ) : eventTypes.length === 0 ? (
          <p className="text-sm text-neutral-500">No hay tipos de evento todavía.</p>
        ) : (
          eventTypes.map((t) => (
            <EventTypeRow key={t.id} entry={t} onUpdate={onUpdate} onDelete={onDelete} />
          ))
        )}
      </ul>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-md border border-dashed border-surface-border hover:border-accent-500 hover:text-accent-400 px-4 py-2 text-sm text-neutral-400 transition-colors w-full text-center"
        >
          + Nuevo tipo de evento
        </button>
      ) : (
        <form onSubmit={submit} className="rounded-md border border-accent-500/50 bg-surface p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Nombre</label>
              <input
                type="text"
                required
                maxLength={60}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Entrega de tarea"
                className="w-full bg-surface border-surface-border text-neutral-100 rounded-md p-2 border text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Color</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value as CalendarEventColor)}
                className="w-full bg-surface border-surface-border text-neutral-100 rounded-md p-2 border text-sm"
              >
                {COLOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={afectaRacha} onChange={(e) => setAfectaRacha(e.target.checked)} />
            Cuenta como día neutro para la racha (ej. Descanso obligatorio)
          </label>
          {formError && (
            <p className="text-xs text-red-300 border border-red-800 bg-red-950/40 rounded-md p-2">
              {formError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 px-4 py-1.5 text-xs font-medium transition-colors"
            >
              {busy ? "Creando..." : "Crear tipo"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="rounded-md border border-surface-border hover:bg-neutral-800 px-4 py-1.5 text-xs text-neutral-300"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function EventTypeRow({
  entry,
  onUpdate,
  onDelete,
}: {
  entry: CalendarEventTypeOut;
  onUpdate: (id: number, payload: Partial<CalendarEventTypePayload>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleAfectaRacha() {
    setBusy(true);
    setError(null);
    try {
      await onUpdate(entry.id, { afecta_racha: !entry.afecta_racha });
    } catch (err) {
      setError(errMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el tipo "${entry.nombre}"? Si ya tiene eventos, el sistema lo rechazará.`)) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete(entry.id);
    } catch (err) {
      setError(errMessage(err));
      setBusy(false);
    }
  }

  return (
    <li className={`rounded-md border p-3 flex items-center justify-between gap-3 ${eventColorClass(entry.color)}`}>
      <div>
        <p className="text-sm font-medium">{entry.nombre}</p>
        {error && <p className="text-xs opacity-80 mt-0.5">{error}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={entry.afecta_racha} disabled={busy} onChange={toggleAfectaRacha} />
          Día neutro
        </label>
        <button onClick={handleDelete} disabled={busy} className="text-xs underline hover:opacity-80">
          Eliminar
        </button>
      </div>
    </li>
  );
}
