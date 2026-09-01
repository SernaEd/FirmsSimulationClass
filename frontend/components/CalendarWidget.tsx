"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarEventOut, api } from "@/lib/api";
import { CalendarGrid, CalendarView, eventColorClass, getVisibleRange } from "@/components/CalendarGrid";

/**
 * Vista compacta del calendario para el dashboard (§2) — reusa el mismo
 * `CalendarGrid`/`getVisibleRange`/`eventColorClass` que `/calendario`
 * (student) y `/admin/calendario`, en vez de duplicar la lógica de grid o
 * de fetch. A diferencia de esas páginas, aquí solo hay lectura: un enlace
 * "Ver calendario completo" manda a `/calendario` para todo lo demás
 * (semana, admin, etc.).
 */
export function CalendarWidget({ token }: { token: string }) {
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventOut[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const range = useMemo(() => getVisibleRange(view, cursor), [view, cursor]);

  useEffect(() => {
    let cancelled = false;
    api
      .getMyCalendarEvents(token, range.start, range.end)
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch(() => {
        // Widget secundario del dashboard: si falla, simplemente no muestra
        // eventos — el error real ya es visible en /calendario.
      });
    return () => {
      cancelled = true;
    };
  }, [token, range.start, range.end]);

  const dayEvents = selectedDate ? events.filter((e) => e.fecha === selectedDate) : [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.1em] text-accent-400">Calendario</p>
        <Link
          href="/calendario"
          className="text-xs text-neutral-400 hover:text-accent-300 underline underline-offset-2"
        >
          Ver calendario completo
        </Link>
      </div>

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
        <div className="rounded-md bg-surface-raised shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-neutral-100">{selectedDate}</h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-neutral-500 hover:text-neutral-300"
            >
              Cerrar ✕
            </button>
          </div>
          {dayEvents.length === 0 ? (
            <p className="text-sm text-neutral-500">No hay eventos este día.</p>
          ) : (
            <ul className="space-y-2">
              {dayEvents.map((ev) => (
                <li key={ev.id} className={`rounded-md border p-3 text-sm ${eventColorClass(ev.tipo.color)}`}>
                  <p className="font-medium">
                    {ev.titulo} <span className="text-xs opacity-70">— {ev.tipo.nombre}</span>
                  </p>
                  {ev.descripcion && <p className="text-xs opacity-80 mt-0.5">{ev.descripcion}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
