"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ApiError, api } from "@/lib/api";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success" };

export default function Registro() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "submitting" });

    const form = new FormData(event.currentTarget);
    try {
      await api.register({
        nombre: String(form.get("nombre") ?? "").trim(),
        apellidos: String(form.get("apellidos") ?? "").trim(),
        numero_cuenta: String(form.get("numero_cuenta") ?? "").trim(),
        nickname: String(form.get("nickname") ?? "").trim(),
        pin: String(form.get("pin") ?? ""),
        correo_institucional: String(form.get("correo_institucional") ?? "").trim() || undefined,
        acepta_reglas: form.get("acepta_reglas") === "on",
      });
      setStatus({ kind: "success" });
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : String(err);
      setStatus({ kind: "error", message });
    }
  }

  if (status.kind === "success") {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6 text-center">
          <h1 className="text-3xl font-semibold">Cuenta creada</h1>
          <p className="text-neutral-400">
            Tu registro fue recibido. El profesor debe aprobar tu cuenta antes de
            que puedas ingresar al Dashboard.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-ibero-red hover:bg-ibero-red-dark transition-colors px-6 py-3 font-medium"
          >
            Ir al login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-lg mx-auto p-8 space-y-8">
      <header className="space-y-2">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300">
          ← Regresar
        </Link>
        <h1 className="text-3xl font-semibold">Registro</h1>
        <p className="text-neutral-400 text-sm">
          Al terminar quedará pendiente la aprobación del profesor antes de que
          puedas ingresar.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre" name="nombre" required minLength={1} maxLength={100} />
          <Field label="Apellidos" name="apellidos" required minLength={1} maxLength={100} />
        </div>
        <Field label="Número de cuenta" name="numero_cuenta" required minLength={4} maxLength={20} />
        <Field
          label="Nickname"
          name="nickname"
          required
          minLength={3}
          maxLength={40}
          hint="Lo verán tus compañeros. Puedes usar letras, números y espacios."
        />
        <Field
          label="PIN"
          name="pin"
          type="password"
          required
          minLength={6}
          maxLength={32}
          hint="Mínimo 6 caracteres. Elige algo memorable pero no obvio."
        />
        <Field
          label="Correo institucional (opcional)"
          name="correo_institucional"
          type="email"
          hint="Solo lo pediremos si activas notificaciones desde tu perfil."
        />

        <label className="flex items-start gap-3 text-sm text-neutral-300 pt-2">
          <input
            type="checkbox"
            name="acepta_reglas"
            required
            className="mt-1 h-4 w-4 accent-ibero-red"
          />
          <span>
            He leído y acepto las{" "}
            <Link href="/reglas" target="_blank" className="underline hover:text-white">
              reglas y el aviso de privacidad
            </Link>
            .
          </span>
        </label>

        {status.kind === "error" && (
          <p className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
            {status.message}
          </p>
        )}

        <button
          type="submit"
          disabled={status.kind === "submitting"}
          className="w-full rounded-lg bg-ibero-red hover:bg-ibero-red-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-6 py-3 font-medium"
        >
          {status.kind === "submitting" ? "Registrando..." : "Crear cuenta"}
        </button>

        <p className="text-center text-sm text-neutral-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="underline hover:text-neutral-300">
            Inicia sesión
          </Link>
          .
        </p>
      </form>
    </main>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  hint?: string;
};

function Field({ label, name, type = "text", required, minLength, maxLength, hint }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm text-neutral-300">
        {label}
        {required && <span className="text-ibero-red"> *</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 text-white focus:border-ibero-red focus:outline-none focus:ring-1 focus:ring-ibero-red"
      />
      {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}
