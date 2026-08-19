"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Field } from "@/components/Field";
import { ApiError, api, auth } from "@/lib/api";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export default function Login() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "submitting" });

    const form = new FormData(event.currentTarget);
    try {
      const { access_token } = await api.login({
        numero_cuenta: String(form.get("numero_cuenta") ?? "").trim(),
        pin: String(form.get("pin") ?? ""),
      });
      auth.setToken(access_token);
      router.push("/inicio");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? mapLoginError(err)
          : String(err);
      setStatus({ kind: "error", message });
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <header className="space-y-2">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← Regresar
          </Link>
          <h1 className="text-3xl font-semibold">Iniciar sesión</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Número de cuenta" name="numero_cuenta" required autoFocus />
          <Field label="PIN" name="pin" type="password" required />

          {status.kind === "error" && (
            <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={status.kind === "submitting"}
            className="w-full rounded-lg border border-accent-500 text-accent-300 hover:bg-accent-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-6 py-3 font-medium"
          >
            {status.kind === "submitting" ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-center text-sm text-neutral-500">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="underline hover:text-neutral-300">
              Regístrate
            </Link>
            .
          </p>
          <p className="text-center text-xs text-neutral-500">
            ¿Olvidaste tu PIN? Pídele al profesor un reset manual.
          </p>
        </form>
      </div>
    </main>
  );
}

function mapLoginError(err: ApiError): string {
  if (err.status === 429) {
    return "Demasiados intentos. Espera 15 minutos antes de volver a intentar.";
  }
  if (err.status === 401) {
    return "Número de cuenta o PIN incorrecto.";
  }
  return err.detail;
}
