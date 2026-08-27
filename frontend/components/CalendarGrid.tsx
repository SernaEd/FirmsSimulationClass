"use client";

import { CalendarEventOut } from "@/lib/api";

export type CalendarView = "month" | "week";

/** Paleta fija de eventos (mismos 6 valores que `CalendarEventColor` en
 *  `backend/app/schemas/calendar.py`) mapeada a las clases Tailwind que ya
 *  usa el resto de la app para badges de estado (ver `StatusBadge` en
 *  `mis-tickets`/`decimas`: fondo -900/60, texto -300, borde -800). */
const COLOR_CLASSES: Record<string, string> = {
  neutral: "bg-neutral-800 text-neutral-300 border-neutral-700",
  accent: "bg-accent-900/50 text-accent-300 border-accent-800",
  accent2: "bg-accent2-900/50 text-accent2-300 border-accent2-800",
  red: "bg-red-950/60 text-red-300 border-red-800",
  amber: "bg-amber-900/60 text-amber-300 border-amber-800",
  emerald: "bg-emerald-900/60 text-emerald-300 border-emerald-800",
};

export function eventColorClass(color: string): string {
  return COLOR_CLASSES[color] ?? COLOR_CLASSES.neutral;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Lunes de la semana que contiene `d` (semana lunes-domingo). */
function mondayOf(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = copy.getDay(); // 0=domingo..6=sábado
  const diff = dow === 0 ? -6 : 1 - dow;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function getWeekDates(cursor: Date): Date[] {
  const start = mondayOf(cursor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Semanas completas (lunes-domingo) que cubren el mes de `cursor`, para que
 *  el grid mensual no tenga huecos al inicio/fin. */
function getMonthGridDates(cursor: Date): Date[] {
  const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const lastOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const start = mondayOf(firstOfMonth);
  const end = mondayOf(lastOfMonth); // lunes de la última semana visible
  const dates: Date[] = [];
  let d = start;
  while (d <= end) {
    for (let i = 0; i < 7; i++) dates.push(addDays(d, i));
    d = addDays(d, 7);
  }
  return dates;
}

/** Rango [start, end] (YYYY-MM-DD) que cubre lo visible para `view`/`cursor`
 *  -- lo que el caller debe pedirle a la API (incluye días de meses
 *  vecinos que se asoman en el grid mensual). */
export function getVisibleRange(view: CalendarView, cursor: Date): { start: string; end: string } {
  const dates = view === "month" ? getMonthGridDates(cursor) : getWeekDates(cursor);
  return { start: toDateStr(dates[0]), end: toDateStr(dates[dates.length - 1]) };
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CalendarGrid({
  view,
  cursor,
  events,
  selectedDate,
  onSelectDate,
  onCursorChange,
  onViewChange,
}: {
  view: CalendarView;
  cursor: Date;
  events: CalendarEventOut[];
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
  onCursorChange: (next: Date) => void;
  onViewChange: (next: CalendarView) => void;
}) {
  const todayStr = toDateStr(new Date());
  const dates = view === "month" ? getMonthGridDates(cursor) : getWeekDates(cursor);
  const eventsByDate = new Map<string, CalendarEventOut[]>();
  for (const e of events) {
    const list = eventsByDate.get(e.fecha) ?? [];
    list.push(e);
    eventsByDate.set(e.fecha, list);
  }

  // En vista mensual se navega por mes calendario (no ±30 días -- eso se
  // saltaría o repetiría meses cortos/largos según el día del cursor).
  const goPrev = () =>
    onCursorChange(
      view === "month" ? new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1) : addDays(cursor, -7),
    );
  const goNext = () =>
    onCursorChange(
      view === "month" ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1) : addDays(cursor, 7),
    );

  return (
    <div className="rounded-md bg-surface-raised shadow-md p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            aria-label="Anterior"
            className="w-8 h-8 flex items-center justify-center rounded-md border border-surface-border hover:bg-surface transition-colors"
          >
            ‹
          </button>
          <h2 className="text-lg font-medium text-neutral-100 min-w-[160px] text-center capitalize">
            {view === "month"
              ? `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`
              : `Semana del ${dates[0].getDate()} de ${MESES[dates[0].getMonth()]}`}
          </h2>
          <button
            onClick={goNext}
            aria-label="Siguiente"
            className="w-8 h-8 flex items-center justify-center rounded-md border border-surface-border hover:bg-surface transition-colors"
          >
            ›
          </button>
          <button
            onClick={() => onCursorChange(new Date())}
            className="ml-1 text-xs rounded-md border border-surface-border hover:bg-surface px-2 py-1 transition-colors"
          >
            Hoy
          </button>
        </div>
        <div className="flex rounded-md border border-surface-border overflow-hidden text-xs">
          {(["month", "week"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1.5 transition-colors ${
                view === v ? "bg-accent-600 text-white" : "hover:bg-surface text-neutral-400"
              }`}
            >
              {v === "month" ? "Mes" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DIAS_CORTOS.map((d) => (
          <div key={d} className="text-center text-[11px] uppercase tracking-wider text-neutral-500 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {dates.map((d) => {
          const dateStr = toDateStr(d);
          const dayEvents = eventsByDate.get(dateStr) ?? [];
          const inCurrentMonth = view === "week" || d.getMonth() === cursor.getMonth();
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const visibleEvents = view === "month" ? dayEvents.slice(0, 3) : dayEvents;
          const overflow = view === "month" ? dayEvents.length - visibleEvents.length : 0;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`text-left rounded-md border p-1.5 flex flex-col gap-1 transition-colors ${
                view === "month" ? "min-h-[84px]" : "min-h-[140px]"
              } ${
                isSelected
                  ? "border-accent-500 bg-accent-900/10"
                  : "border-surface-border hover:bg-surface"
              } ${!inCurrentMonth ? "opacity-40" : ""}`}
            >
              <span
                className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday ? "bg-accent-600 text-white" : "text-neutral-400"
                }`}
              >
                {d.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {visibleEvents.map((e) => (
                  <span
                    key={e.id}
                    className={`text-[10px] leading-tight truncate rounded px-1 py-0.5 border ${eventColorClass(e.tipo.color)}`}
                    title={e.titulo}
                  >
                    {e.titulo}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="text-[10px] text-neutral-500">+{overflow} más</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
