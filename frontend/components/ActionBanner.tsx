import Link from "next/link";
import { ReactNode } from "react";
import { IconArrowRight } from "@/components/icons";
import { CARD_MD } from "@/lib/ui";

/**
 * Banner de "siguiente acción" — una tarjeta ancha con ícono + copy + botón,
 * usada en varias pantallas para motivar la acción principal de esa pantalla
 * (ver UiDesign/README.md, "Motivating action banner"). Mismo lenguaje visual
 * que las tarjetas de Bienvenida/QuickTile: elevación por sombra, sin relleno
 * sólido de acento, hover con lift + borde tintado.
 */
export function ActionBanner({
  icon,
  title,
  description,
  href,
  cta,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-4 sm:gap-5 ${CARD_MD} p-5 sm:p-6 border border-transparent transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-600`}
    >
      <div className="hidden sm:flex shrink-0 items-center justify-center w-11 h-11 rounded-full bg-accent-900 text-accent-300">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{description}</p>
      </div>
      <span className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-accent-500 text-accent-300 px-3.5 py-2 text-sm font-medium transition-colors group-hover:bg-accent-500/10">
        {cta}
        <IconArrowRight />
      </span>
    </Link>
  );
}
