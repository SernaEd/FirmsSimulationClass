"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { UserOut } from "@/lib/api";
import { useAuthContext } from "@/lib/AuthContext";

type Result =
  | { status: "loading"; token: null; user: null; error: null }
  | { status: "authenticated"; token: string; user: UserOut; error: null }
  | { status: "error"; token: string | null; user: null; error: string };

/**
 * Hook para páginas autenticadas: lee el estado global de AuthContext
 * (compartido por todo el layout, sin refetch de /auth/me en cada
 * navegación) y redirige a /login si no hay sesión o expiró.
 * Si `requireAdmin` es true, redirige a /inicio si el usuario no es admin.
 *
 * No redirige a /login si esta misma página ya estuvo autenticada durante
 * su vida (`wasAuthenticated`): ese caso es un logout explícito, que ya
 * navega por su cuenta (típicamente a "/"), y no debe competir por la
 * navegación con este hook.
 */
export function useAuth(options: { requireAdmin?: boolean } = {}): Result {
  const ctx = useAuthContext();
  const router = useRouter();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (ctx.status === "authenticated") {
      wasAuthenticated.current = true;
    }
  }, [ctx.status]);

  useEffect(() => {
    if (ctx.status === "unauthenticated" && !wasAuthenticated.current) {
      router.replace("/login");
      return;
    }
    if (ctx.status === "authenticated" && options.requireAdmin && !ctx.user.is_admin) {
      router.replace("/inicio");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.status]);

  if (ctx.status === "unauthenticated") {
    return { status: "loading", token: null, user: null, error: null };
  }
  return ctx;
}
