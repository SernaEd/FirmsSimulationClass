from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

class DailyExerciseBase(BaseModel):
    fecha: date
    tema: str
    numero: int
    enunciado: str

class DailyExerciseCreate(DailyExerciseBase):
    pass

class DailyExerciseOut(DailyExerciseBase):
    id: int
    imagen_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
