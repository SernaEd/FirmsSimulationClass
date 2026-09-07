from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.content import CourseSessionListOut

class DailyExerciseBase(BaseModel):
    fecha: date
    course_session_id: Optional[int] = None
    numero: int
    enunciado: str

class DailyExerciseCreate(DailyExerciseBase):
    pass

class DailyExerciseOut(DailyExerciseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    imagen_path: Optional[str] = None
    created_at: datetime
    course_session: Optional[CourseSessionListOut] = None
