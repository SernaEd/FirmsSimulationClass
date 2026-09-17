"""Schemas del solver interactivo de Euler (Sesión 8, §Métodos Numéricos).

Ver `app.services.euler` para la lógica y `sesion8/guion_presentacion.md`
(Diapositiva 10) para el comportamiento esperado en la plataforma.

`Optional[X]`/`List[X]` en vez de `X | None`/`list[X]`: mismo motivo que
`schemas/licitaciones.py`/`schemas/calendar.py` — falsos positivos
confirmados del linter Community de Qodana sobre la sintaxis moderna.
"""

from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

EulerModelKey = Literal["paracaidista", "forense", "custom"]


class EulerModelInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    key: str
    nombre: str
    descripcion: str
    expresion_display: str
    x0: float
    y0: float
    tiene_exacta: bool


class EulerSimulateIn(BaseModel):
    modelo: EulerModelKey
    # Solo se usa (y se exige) cuando modelo == "custom" — un f(x,y) en
    # texto libre, parseado de forma segura en app.services.euler.
    expresion: Optional[str] = Field(default=None, max_length=200)
    x0: float = Field(ge=-1_000, le=1_000)
    y0: float = Field(ge=-1_000, le=1_000)
    h: float = Field(gt=0, le=5)
    n_pasos: int = Field(ge=1, le=500)

    @model_validator(mode="after")
    def _check_custom_expression(self) -> "EulerSimulateIn":
        if self.modelo == "custom" and not (self.expresion and self.expresion.strip()):
            raise ValueError("Escribe una ecuación dy/dx = f(x, y) para el modelo personalizado.")
        return self


class EulerStepOut(BaseModel):
    n: int
    x: float
    y: float
    exacta: Optional[float] = None
    error_abs: Optional[float] = None
    error_rel: Optional[float] = Field(
        None, description="Error relativo porcentual respecto a la solución exacta (%)"
    )


class VectorFieldPointOut(BaseModel):
    x: float
    y: float
    pendiente: float


class CurvePointOut(BaseModel):
    x: float
    y: float


class EulerSimulateOut(BaseModel):
    pasos: List[EulerStepOut]
    campo_direcciones: List[VectorFieldPointOut]
    # Muestreo fino (independiente del paso h) de la solución exacta, para
    # dibujarla como curva suave — a diferencia de `pasos[].exacta`, que solo
    # trae un valor por cada paso de Euler (útil para la tabla, no para una
    # curva suave cuando h es grande). Vacío si el modelo no tiene exacta.
    curva_exacta: List[CurvePointOut]
    tiene_exacta: bool
    # Índice de paso (n) en el que la iteración se detuvo por desbordar o
    # salir del dominio de f (p. ej. log de un número negativo) — None si
    # los n_pasos se completaron sin problema. `pasos` solo contiene los
    # pasos válidos hasta ese punto.
    diverged_at: Optional[int] = None
    x_min: float
    x_max: float
    y_min: float
    y_max: float
    expresion_evaluada: str
