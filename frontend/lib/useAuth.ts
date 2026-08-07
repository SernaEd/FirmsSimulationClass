"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, UserOut, api, auth } from "@/lib/api";

type Result =
  | { status: "loading"; token: null; user: null; error: null }
  | { status: "authenticated"; token: string; user: UserOut; error: null }
  | { status: "error"; token: string | null; user: null; error: string };

/**
 * Hook para páginas autenticadas: obtiene el token de localStorage,
 * llama a /auth/me, y redirige a /login si no hay sesión o expiró.
 * Si `requireAdmin` es true, redirige a /inicio si el usuario no es admin.
 */
export function useAuth(options: { requireAdmin?: boolean } = {}): Result {
  const [state, setState] = useState<Result>({
    status: "loading",
    token: null,
    user: null,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    const token = auth.getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    api
      .me(token)
      .then((user) => {
        if (options.requireAdmin && !user.is_admin) {
          router.replace("/inicio");
          return;
        }
        setState({ status: "authenticated", token, user, error: null });
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          auth.clearToken();
          router.replace("/login");
          return;
        }
        setState({
          status: "error",
          token,
          user: null,
          error: err instanceof ApiError ? err.detail : String(err),
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
