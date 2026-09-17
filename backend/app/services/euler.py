"""Solver interactivo de Euler para EDOs de primer orden (Sesión 8).

Cálculo puro, sin persistencia: dado un modelo preconstruido — paracaidista
o caso forense, ambos ya resueltos exactamente en la Sesión 6, ver
`sesion8/guion_presentacion.md` Diapositivas 6-8 — o una ecuación
dy/dx = f(x, y) personalizada, aplica el método de Euler y arma el campo de
direcciones para graficar (Diapositiva 10: "eligen un modelo preconstruido
[...] o su propia ecuación f(x,y) [...] y el sistema les dibuja en vivo la
poligonal de Euler contra la curva exacta cuando existe").

Parseo seguro de la ecuación personalizada: `sympy.parse_expr` con un
`global_dict` vacío (sin builtins) y un `local_dict` que solo expone x, y y
un puñado de funciones matemáticas — nunca un `eval`/`exec` sobre texto
arbitrario del alumno.
"""

from __future__ import annotations

import math
import re
from typing import Callable, Dict, List, Optional

import sympy
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

from app.schemas.euler import (
    CurvePointOut,
    EulerModelInfo,
    EulerSimulateIn,
    EulerSimulateOut,
    EulerStepOut,
    VectorFieldPointOut,
)

_X, _Y = sympy.symbols("x y")

_ALLOWED_NAMES: Dict[str, object] = {
    "x": _X,
    "y": _Y,
    "sin": sympy.sin,
    "cos": sympy.cos,
    "tan": sympy.tan,
    "exp": sympy.exp,
    "log": sympy.log,
    "ln": sympy.log,
    "sqrt": sympy.sqrt,
    "Abs": sympy.Abs,
    "abs": sympy.Abs,
    "pi": sympy.pi,
    "E": sympy.E,
}

# `global_dict` explícito (en vez de dejar que `parse_expr` use su default
# de `from sympy import *`, que arrastra el `__builtins__` real de Python
# hacia el `eval` interno del parser): solo estos cuatro constructores, que
# `standard_transformations` necesita para números literales (`auto_number`
# genera `Float('9.8')`/`Integer(3)`), y nada más.
_SAFE_GLOBALS: Dict[str, object] = {
    "__builtins__": {},
    "Integer": sympy.Integer,
    "Float": sympy.Float,
    "Rational": sympy.Rational,
    "Symbol": sympy.Symbol,
}

_TRANSFORMATIONS = standard_transformations + (
    implicit_multiplication_application,
    convert_xor,
)

_MAX_EXPRESSION_LENGTH = 200

# Segunda capa de defensa, independiente del `global_dict` restringido de
# arriba: un allowlist de caracteres previo al parseo. Sin esto, un payload
# como `().__class__.__bases__[0].__subclasses__()` pasa el parser de sympy
# igual (atributos como `__class__` no dependen de `__builtins__`, así que
# bloquear solo builtins no alcanza) y permite recorrer la jerarquía de
# tipos de Python hasta encontrar algo ejecutable. Ninguna ecuación
# diferencial "básica" legítima necesita `_`, `[`, `]`, comillas o `;` — se
# excluyen todas en vez de intentar enumerar cada payload conocido.
_SAFE_CHARS_RE = re.compile(r"^[0-9A-Za-z.+\-*/^() \t]*$")

# Ambos modelos son lineales de la forma dy/dx = k*(y_eq - y), con solución
# cerrada y(x) = y_eq + (y0 - y_eq) * exp(-k*(x - x0)) — se reutiliza para
# la comparación contra la aproximación de Euler (Diapositiva 8).
_PRESETS: Dict[str, dict] = {
    "paracaidista": {
        "nombre": "Paracaidista (Sesión 6, Caso 4)",
        "descripcion": "dv/dt = 9.8 − 0.25v — velocidad de caída con resistencia del aire (m = 80 kg).",
        "expresion_display": "9.8 - 0.25*y",
        "x0": 0.0,
        "y0": 0.0,
        "y_eq": 39.2,
        "k": 0.25,
    },
    "forense": {
        "nombre": "Caso forense (Sesión 6, Caso 2)",
        "descripcion": "dT/dt = −0.0994(T − 20) — enfriamiento de Newton (T en °C).",
        "expresion_display": "-0.0994*(y - 20)",
        "x0": 0.0,
        "y0": 34.8,
        "y_eq": 20.0,
        "k": 0.0994,
    },
}

_FIELD_COLUMNS = 14
_FIELD_ROWS = 10
_EXACT_CURVE_SAMPLES = 80


def list_model_catalog() -> List[EulerModelInfo]:
    return [
        EulerModelInfo(
            key=key,
            nombre=preset["nombre"],
            descripcion=preset["descripcion"],
            expresion_display=preset["expresion_display"],
            x0=preset["x0"],
            y0=preset["y0"],
            tiene_exacta=True,
        )
        for key, preset in _PRESETS.items()
    ]


def parse_ode_expression(raw: str) -> sympy.Expr:
    """Convierte un texto como `9.8 - 0.25*y` en una expresión sympy,
    restringida a las variables x, y y un set fijo de funciones — nunca
    ejecuta el texto del alumno como Python."""
    text = raw.strip()
    if not text:
        raise ValueError("La ecuación no puede estar vacía.")
    if len(text) > _MAX_EXPRESSION_LENGTH:
        raise ValueError("La ecuación es demasiado larga.")
    if not _SAFE_CHARS_RE.match(text):
        raise ValueError(
            "La ecuación contiene caracteres no permitidos. Usa solo x, y, números, "
            "operadores (+ - * / ^) y funciones como sin, cos, tan, exp, log, sqrt."
        )

    try:
        expr = parse_expr(
            text,
            local_dict=_ALLOWED_NAMES,
            global_dict=_SAFE_GLOBALS,
            transformations=_TRANSFORMATIONS,
        )
    except Exception as exc:
        raise ValueError(f"No se pudo interpretar la ecuación: {exc}") from exc

    if not isinstance(expr, sympy.Basic):
        raise ValueError("La ecuación no es una expresión matemática válida.")

    extra = expr.free_symbols - {_X, _Y}
    if extra:
        nombres = ", ".join(sorted(str(s) for s in extra))
        raise ValueError(f"Solo se permiten las variables x, y — se encontró: {nombres}")

    return expr


# Cada preset es un texto fijo conocido en tiempo de carga del módulo — a
# diferencia de una ecuación personalizada, no hay razón para volver a
# parsearlo y compilarlo (parse_ode_expression + lambdify) en cada llamada a
# simulate(). Se resuelve una sola vez aquí y se reutiliza el callable.
for _preset in _PRESETS.values():
    _preset["f"] = sympy.lambdify(
        (_X, _Y), parse_ode_expression(_preset["expresion_display"]), modules=["math"]
    )
del _preset


def _linear_exact_solution(y_eq: float, k: float, x0: float, y0: float) -> Callable[[float], float]:
    def exact(x: float) -> float:
        return y_eq + (y0 - y_eq) * math.exp(-k * (x - x0))

    return exact


def _build_step(
    n: int, x: float, y: float, exact_fn: Optional[Callable[[float], float]]
) -> EulerStepOut:
    if exact_fn is None:
        return EulerStepOut(n=n, x=x, y=y)
    exacta = exact_fn(x)
    err_abs = abs(y - exacta)
    err_rel = (err_abs / abs(exacta) * 100.0) if abs(exacta) > 1e-12 else None
    return EulerStepOut(
        n=n, x=x, y=y, exacta=exacta, error_abs=err_abs, error_rel=err_rel
    )


def _build_vector_field(
    f: Callable[[float, float], float], x_min: float, x_max: float, y_min: float, y_max: float
) -> List[VectorFieldPointOut]:
    points: List[VectorFieldPointOut] = []
    for i in range(_FIELD_COLUMNS):
        xv = x_min + (x_max - x_min) * i / (_FIELD_COLUMNS - 1)
        for j in range(_FIELD_ROWS):
            yv = y_min + (y_max - y_min) * j / (_FIELD_ROWS - 1)
            try:
                slope = float(f(xv, yv))
            except Exception:
                continue
            if not math.isfinite(slope):
                continue
            points.append(VectorFieldPointOut(x=xv, y=yv, pendiente=slope))
    return points


def _build_exact_curve(
    exact_fn: Callable[[float], float], x_min: float, x_max: float
) -> List[CurvePointOut]:
    points: List[CurvePointOut] = []
    for i in range(_EXACT_CURVE_SAMPLES):
        x = x_min + (x_max - x_min) * i / (_EXACT_CURVE_SAMPLES - 1)
        y = exact_fn(x)
        if math.isfinite(y):
            points.append(CurvePointOut(x=x, y=y))
    return points


def simulate(payload: EulerSimulateIn) -> EulerSimulateOut:
    exact_fn: Optional[Callable[[float], float]] = None

    if payload.modelo == "custom":
        expr = parse_ode_expression(payload.expresion or "")
        expr_display = str(expr)
        f = sympy.lambdify((_X, _Y), expr, modules=["math"])
    else:
        preset = _PRESETS.get(payload.modelo)
        if preset is None:
            raise ValueError("Modelo no reconocido.")
        expr_display = preset["expresion_display"]
        f = preset["f"]
        exact_fn = _linear_exact_solution(preset["y_eq"], preset["k"], payload.x0, payload.y0)

    x0, h = payload.x0, payload.h
    y = payload.y0
    steps: List[EulerStepOut] = [_build_step(0, x0, y, exact_fn)]
    diverged_at: Optional[int] = None

    for n in range(1, payload.n_pasos + 1):
        x_prev = x0 + (n - 1) * h
        try:
            slope = float(f(x_prev, y))
        except Exception:
            diverged_at = n
            break
        if not math.isfinite(slope):
            diverged_at = n
            break

        y_next = y + h * slope
        if not math.isfinite(y_next):
            diverged_at = n
            break

        y = y_next
        steps.append(_build_step(n, x0 + n * h, y, exact_fn))

    xs = [s.x for s in steps]
    ys = [s.y for s in steps]
    if exact_fn is not None:
        ys.extend(s.exacta for s in steps if s.exacta is not None)

    x_min, x_max = min(xs), max(xs)
    y_min, y_max = min(ys), max(ys)
    x_pad = max((x_max - x_min) * 0.1, 0.5)
    y_pad = max((y_max - y_min) * 0.15, 0.5)
    x_min, x_max = x_min - x_pad, x_max + x_pad
    y_min, y_max = y_min - y_pad, y_max + y_pad

    return EulerSimulateOut(
        pasos=steps,
        campo_direcciones=_build_vector_field(f, x_min, x_max, y_min, y_max),
        curva_exacta=_build_exact_curve(exact_fn, x_min, x_max) if exact_fn is not None else [],
        tiene_exacta=exact_fn is not None,
        diverged_at=diverged_at,
        x_min=x_min,
        x_max=x_max,
        y_min=y_min,
        y_max=y_max,
        expresion_evaluada=expr_display,
    )
