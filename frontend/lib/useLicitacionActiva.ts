"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthContext } from "@/lib/AuthContext";

/**
 * Solo puede haber una licitación abierta a la vez (§ ver
 * admin/licitaciones, `abrir_licitacion` lo aplica en el backend). Se usa
 * para no mostrar "Licitaciones" en la navegación cuando no hay ninguna
 * abierta — mismo criterio que `useFeatureFlag` para "Décimas": oculto por
 * default mientras se resuelve el fetch, nunca un "true" optimista.
 */
export function useLicitacionActiva(): boolean {
  const authState = useAuthContext();
  const token = authState.status === "authenticated" ? authState.token : null;
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!token) {
      setActive(false);
      return;
    }
    let cancelled = false;
    api
      .licitacionActiva(token)
      .then((licitacion) => {
        if (!cancelled) setActive(licitacion !== null);
      })
      .catch(() => {
        if (!cancelled) setActive(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return active;
}
