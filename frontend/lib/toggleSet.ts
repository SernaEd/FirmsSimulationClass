/** Alterna la presencia de `value` en `set`, aplicando la copia via `setter`. */
export function toggleSet<T>(set: Set<T>, setter: (next: Set<T>) => void, value: T) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  setter(next);
}
