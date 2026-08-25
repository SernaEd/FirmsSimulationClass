import { redirect } from "next/navigation";

// /clase1 fue la primera versión (standalone, sin backend) de Sesión 1 —
// consolidada dentro de /clases (Módulo 1 · Presentación del curso, ver
// migración a1c3f6e29b7d y UiDesign/README.md). Se deja este redirect en
// vez de borrar la ruta para no romper enlaces/marcadores existentes.
export default function Clase1Redirect() {
  redirect("/clases");
}
