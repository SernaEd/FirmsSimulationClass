/** Fecha de "hoy" en zona horaria de Ciudad de México, como YYYY-MM-DD.
 *  Mismo criterio que usa el backend (`services/streak.py::today_mx`) para
 *  decidir a qué día pertenece un ejercicio o un envío del alumno. */
export function todayMxStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
}
