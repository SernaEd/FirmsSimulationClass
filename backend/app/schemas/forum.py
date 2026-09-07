"""Schemas de Comentarios por Clase (foro por sesión) — Iteración 1."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ForumPostIn(BaseModel):
    cuerpo: str = Field(min_length=1, max_length=4000)
    es_anonimo_para_pares: bool = False
    parent_post_id: Optional[int] = None  # None = comentario de primer nivel


class ForumPostOut(BaseModel):
    """A diferencia de otros *Out de este módulo, no se arma con
    `model_validate(orm_obj)` — `autor_nombre` depende de quién lo pide
    (el profesor siempre ve el autor real; un par ve "Anónimo" si el post
    es anónimo y no es su propio post), así que se construye a mano en
    `services.forum` en vez de leerse como atributo fijo del modelo."""

    id: int
    session_id: int
    parent_post_id: Optional[int]
    cuerpo: str
    es_anonimo_para_pares: bool
    destacado: bool
    created_at: datetime
    autor_nombre: str
    es_mio: bool
    replies: list["ForumPostOut"] = []


class MarkDestacadoIn(BaseModel):
    # Sugerido 10-20 Tks (§9), a discreción del profesor — no se fuerza ese rango.
    monto_tokens: int = Field(ge=1, le=1000)
