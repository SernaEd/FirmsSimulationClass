"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuthContext } from "@/lib/AuthContext";

/**
 * Lee un feature flag del sistema (§5.2) para decidir qué mostrar en la UI
 * — ej. ocultar "Décimas" fuera de las últimas semanas del semestre.
 * Devuelve `null` mientras carga o si no hay sesión — nunca `false` a
 * propósito: un consumidor que solo oculta algo (`{flag && <Tile/>}`) trata
 * `null` igual que `false` sin cambios, pero uno que además necesita
 * distinguir "todavía no sé" de "confirmado apagado" (ej. la página de
 * Décimas, que muestra un aviso de "no disponible" cuando SÍ está apagado)
 * puede hacerlo sin mostrar ese aviso de más mientras el fetch resuelve.
 */
export function useFeatureFlag(key: string): boolean | null {
  const authState = useAuthContext();
  const token = authState.status === "authenticated" ? authState.token : null;
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setEnabled(null);
      return;
    }
    let cancelled = false;
    api
      .getFeatureFlag(token, key)
      .then((res) => {
        if (!cancelled) setEnabled(res.enabled);
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, key]);

  return enabled;
}
