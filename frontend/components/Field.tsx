"use client";

import { useState } from "react";

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  hint?: string;
  autoFocus?: boolean;
};

export function Field({
  label,
  name,
  type = "text",
  required,
  minLength,
  maxLength,
  hint,
  autoFocus,
}: FieldProps) {
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);
  const effectiveType = isPassword && revealed ? "text" : type;

  return (
    <label className="block space-y-1.5">
      <span className="block text-sm text-neutral-300">
        {label}
        {required && <span className="text-ibero-red"> *</span>}
      </span>

      <div className="relative">
        <input
          name={name}
          type={effectiveType}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          autoFocus={autoFocus}
          className={
            "w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 text-white " +
            "focus:border-ibero-red focus:outline-none focus:ring-1 focus:ring-ibero-red " +
            (isPassword ? "pr-11" : "")
          }
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Ocultar PIN" : "Mostrar PIN"}
            aria-pressed={revealed}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 hover:text-white focus:text-white focus:outline-none"
          >
            {revealed ? <IconEyeOff /> : <IconEye />}
          </button>
        )}
      </div>

      {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

function IconEye() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.5 10.5 0 0 1 12 20c-6.5 0-10-7-10-7a18.4 18.4 0 0 1 4.24-5.19" />
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a18.35 18.35 0 0 1-2.28 3.29" />
      <path d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-4.53" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
