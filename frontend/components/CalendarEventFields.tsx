"use client";

import { CalendarEventTypeOut } from "@/lib/api";

/** Par "Tipo de evento" (select, poblado del catálogo) + "Título" (input),
 *  compartido entre el panel por día de `/admin/calendario` (`DayPanel`) y
 *  el atajo "Agregar evento" de `/admin/sistema` (`QuickAddEventSection`)
 *  -- ambos arman el mismo formulario de creación de evento, mismo patrón
 *  de extracción que `CatalogFormFields` en `admin/economia`. */
export function TipoYTituloFields({
  eventTypes,
  tipoId,
  onTipoIdChange,
  titulo,
  onTituloChange,
}: {
  eventTypes: CalendarEventTypeOut[];
  tipoId: number | "";
  onTipoIdChange: (id: number) => void;
  titulo: string;
  onTituloChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Tipo de evento</label>
        <select
          required
          value={tipoId}
          onChange={(e) => onTipoIdChange(Number(e.target.value))}
          className="w-full bg-surface border-surface-border text-neutral-100 rounded-md p-2 border text-sm"
        >
          <option value="">Selecciona...</option>
          {eventTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Título</label>
        <input
          type="text"
          required
          maxLength={120}
          value={titulo}
          onChange={(e) => onTituloChange(e.target.value)}
          className="w-full bg-surface border-surface-border text-neutral-100 rounded-md p-2 border text-sm"
        />
      </div>
    </div>
  );
}
