"use client";

import Link from "next/link";
import { useAuthContext } from "@/lib/AuthContext";

/**
 * Enlace de "regresar" consciente de sesión. A diferencia del resto de la
 * app (páginas ya protegidas por useAuth(), donde /inicio siempre es el
 * destino correcto), páginas públicas como /reglas las visitan tanto
 * personas sin cuenta (desde "/") como alumnos con sesión iniciada (desde
 * el pie de /inicio). Mandar a un alumno logueado de vuelta a "/" lo
 * aterriza en las tarjetas de "Crear cuenta"/"Iniciar sesión", que se lee
 * como si le pidiera iniciar sesión de nuevo aunque nunca perdió la sesión.
 */
export function HomeLink({ className }: { className?: string }) {
  const authState = useAuthContext();
  const href = authState.status === "authenticated" ? "/inicio" : "/";
  return (
    <Link href={href} className={className}>
      ← Regresar
    </Link>
  );
}
