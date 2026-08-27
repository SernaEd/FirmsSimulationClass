"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, CalendarEventOut, api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { CalendarGrid, CalendarView, eventColorClass, getVisibleRange } from "@/components/CalendarGrid";

function errMessage(err: unknown): string {
  if (err instanceof ApiError) return err.detail;
  if (err instanceof Error) return err.message;
  return String(err);
}

export default function Calendario() {
  const authState = useAuth();
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventOut[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState("");

  const range = useMemo(() => getVisibleRange(view, cursor), [view, cursor]);
  const token = authState.status === "authenticated" ? authState.token : null;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .getMyCalendarEvents(token, range.start, range.end)
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [token, range.start, range.end]);

  if (authState.status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-neutral-500">Cargando…</p>
      </main>
    );
  }
  if (authState.status === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <p className="text-red-400">Error: {authState.error}</p>
      </main>
    );
  }

  const dayEvents = selectedDate ? events.filter((e) => e.fecha === selectedDate) : [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6">
        <p className="text-accent-400 text-xs uppercase tracking-[0.12em] mb-1">Cálculo 3</p>
        <h1 className="text-2xl font-medium text-neutral-100">Calendario</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Exámenes, entregas, licitaciones y descansos del curso, más cualquier excepción que tu
          profesor haya agregado para ti.
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
        <section className="rounded-md bg-surface-raised shadow-md p-6 mt-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-neutral-100">{selectedDate}</h2>
            <button onClick={() => setSelectedDate(null)} className="text-xs text-neutral-500 hover:text-neutral-300">
              Cerrar ✕
            </button>
          </div>
          {dayEvents.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay eventos este día.</p>
          ) : (
            <ul className="space-y-2">
              {dayEvents.map((ev) => (
                <li key={ev.id} className={`rounded-md border p-3 ${eventColorClass(ev.tipo.color)}`}>
                  <p className="text-sm font-medium">
                    {ev.titulo} <span className="text-xs opacity-70">— {ev.tipo.nombre}</span>
                  </p>
                  {ev.descripcion && <p className="text-xs opacity-80 mt-0.5">{ev.descripcion}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
