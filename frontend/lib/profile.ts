import { UserProfile } from "@/lib/api";

// Etiquetas, descripciones y color por rol de equipo (test de perfil,
// Iteración 1) — fuente única para Mi equipo (tags/avatares) y la pantalla
// de resultado del test de perfil. Ver UiDesign/README.md, "Implementation
// notes", § pantalla de resultado del test.
export const PROFILE_LABEL: Record<UserProfile, string> = {
  analista: "Analista",
  integrador: "Integrador",
  modelador: "Modelador",
};

// Versión corta — subtexto junto al nombre en Mi equipo.
export const PROFILE_HINT: Record<UserProfile, string> = {
  analista: "Rigor y verificación",
  integrador: "Organización y síntesis",
  modelador: "Estructura y estrategia",
};

// Versión larga — pantalla de resultado del test de perfil.
export const PROFILE_DESCRIPTION: Record<UserProfile, string> = {
  analista:
    "Revisas resultados, detectas errores y verificas que el trabajo esté bien planteado antes de entregarlo.",
  integrador:
    "Conectas el trabajo del equipo, organizas tiempos y entregas, y consolidas el resultado final.",
  modelador:
    "Traduces el problema a resolver en un plan estructurado: planteas la estrategia o esquema conceptual que el equipo va a desarrollar.",
};

export function profileLabel(perfil: UserProfile | null): string {
  return perfil ? PROFILE_LABEL[perfil] : "Sin perfil";
}

export function profileHint(perfil: UserProfile | null): string {
  return perfil ? PROFILE_HINT[perfil] : "Test de perfil pendiente";
}

// Analista → neutral, Integrador → acento primario, Modelador → acento
// secundario (ver UiDesign/README.md §3 "Role → color mapping"). Usado en
// tags (outline en Analista, filled en los otros dos) y avatares (filled).
export function profileTagClass(perfil: UserProfile | null): string {
  if (perfil === "integrador") return "bg-accent-800 text-accent-100";
  if (perfil === "modelador") return "bg-accent2-800 text-accent2-100";
  return "border border-neutral-600 text-neutral-300";
}

export function profileAvatarClass(perfil: UserProfile | null): string {
  if (perfil === "integrador") return "bg-accent-800 text-accent-100";
  if (perfil === "modelador") return "bg-accent2-800 text-accent2-100";
  return "bg-neutral-800 text-neutral-200";
}
