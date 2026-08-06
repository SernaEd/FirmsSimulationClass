import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plataforma Cálculo 3",
  description: "Plataforma de aprendizaje para Cálculo 3 — Ecuaciones Diferenciales, IBERO.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
