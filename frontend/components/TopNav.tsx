"use client";

import Link from "next/link";
import { useAuthContext } from "@/lib/AuthContext";

/**
 * Barra superior fija en todas las páginas (montada en el layout raíz).
 * El logo siempre enlaza a "casa": /inicio si hay sesión activa, / si no.
 */
export function TopNav() {
  const authState = useAuthContext();
  const home = authState.status === "authenticated" ? "/inicio" : "/";

  return (
    <div className="sticky top-0 z-50 border-b border-surface-border bg-surface/95 backdrop-blur">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-3">
        <Link href={home} aria-label="Ir al inicio" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="IBERO" className="h-7 w-auto" />
        </Link>
      </div>
    </div>
  );
}
