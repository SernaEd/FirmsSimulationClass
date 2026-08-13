from pydantic import BaseModel, Field, field_validator

from app.models.user import UserProfile


class ProfileTestOptionOut(BaseModel):
    perfil: UserProfile
    texto: str


class ProfileTestQuestionOut(BaseModel):
    id: int
    orden: int
    enunciado: str
    opciones: list[ProfileTestOptionOut]


class ProfileTestAnswerIn(BaseModel):
    question_id: int
    perfil_elegido: UserProfile


class ProfileTestSubmitIn(BaseModel):
    respuestas: list[ProfileTestAnswerIn] = Field(min_length=1)

    @field_validator("respuestas")
    @classmethod
    def no_duplicate_questions(cls, v: list[ProfileTestAnswerIn]) -> list[ProfileTestAnswerIn]:
        question_ids = [r.question_id for r in v]
        if len(question_ids) != len(set(question_ids)):
            raise ValueError("No puede responder la misma pregunta más de una vez.")
        return v
