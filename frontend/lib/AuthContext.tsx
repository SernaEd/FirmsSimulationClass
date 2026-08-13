"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { AUTH_CHANGE_EVENT, ApiError, AuthChangeDetail, UserOut, api, auth } from "@/lib/api";

export type AuthState =
  | { status: "loading"; token: null; user: null; error: null }
  | { status: "authenticated"; token: string; user: UserOut; error: null }
  | { status: "unauthenticated"; token: null; user: null; error: null }
  | { status: "error"; token: string | null; user: null; error: string };

const AuthContext = createContext<AuthState | null>(null);

const INITIAL_STATE: AuthState = { status: "loading", token: null, user: null, error: null };

function readCachedState(): AuthState {
  const token = auth.getToken();
  if (!token) return { status: "unauthenticated", token: null, user: null, error: null };
  const cachedUser = auth.getCachedUser();
  if (cachedUser) return { status: "authenticated", token, user: cachedUser, error: null };
  return { status: "loading", token: null, user: null, error: null };
}

// localStorage no existe durante SSR: si el estado inicial dependiera de él,
// el HTML del servidor no coincidiría con el primer render del cliente
// (hydration mismatch). Por eso el render inicial siempre es determinista
// (INITIAL_STATE) y el valor cacheado se aplica en un layout effect —
// síncrono antes del primer paint, así no hay parpadeo visible tampoco.
// useLayoutEffect no corre en el servidor (solo produce un warning ahí),
// así que se usa la variante isomórfica.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Vive una sola vez en el layout raíz (persiste entre navegaciones del
 * App Router). Arranca desde el usuario cacheado para no mostrar "Cargando…"
 * en cada página, y revalida /auth/me en background para detectar sesiones
 * revocadas. Reacciona a login/logout vía AUTH_CHANGE_EVENT, disparado por
 * auth.setToken()/clearToken() sin que cada página conozca este contexto.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);

  useIsomorphicLayoutEffect(() => {
    setState(readCachedState());
  }, []);

  useEffect(() => {
    function load(event?: Event) {
      const token = auth.getToken();
      if (!token) {
        setState({ status: "unauthenticated", token: null, user: null, error: null });
        return;
      }

      // auth.setUser() adjunta el UserOut ya fresco al evento (ej. tras el
      // test de perfil) — evita un round-trip a /auth/me redundante.
      const detailUser = (event as CustomEvent<AuthChangeDetail> | undefined)?.detail?.user;
      if (detailUser) {
        setState({ status: "authenticated", token, user: detailUser, error: null });
        return;
      }

      // Si ya estábamos autenticados con este mismo token, no volver a
      // mostrar "loading" mientras se revalida en background.
      setState((prev) =>
        prev.status === "authenticated" && prev.token === token
          ? prev
          : { status: "loading", token: null, user: null, error: null },
      );
      api
        .me(token)
        .then((user) => {
          auth.setCachedUser(user);
          setState({ status: "authenticated", token, user, error: null });
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            auth.clearToken();
            setState({ status: "unauthenticated", token: null, user: null, error: null });
            return;
          }
          setState({
            status: "error",
            token,
            user: null,
            error: err instanceof ApiError ? err.detail : String(err),
          });
        });
    }

    load();
    window.addEventListener(AUTH_CHANGE_EVENT, load);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, load);
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext debe usarse dentro de <AuthProvider>");
  return ctx;
}
