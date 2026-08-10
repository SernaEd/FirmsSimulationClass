import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { TopNav } from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Plataforma Cálculo 3",
  description: "Plataforma de aprendizaje para Cálculo 3 — Ecuaciones Diferenciales, IBERO.",
};

// favicon servido por convención de archivo: app/favicon.ico (Next.js App Router).

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <TopNav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
