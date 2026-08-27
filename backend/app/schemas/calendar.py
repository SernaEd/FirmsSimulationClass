from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class AcademicCalendarDayCreate(BaseModel):
    fecha: date
    motivo: str = Field(min_length=1, max_length=200)


class AcademicCalendarDayOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fecha: date
    motivo: str
    created_at: datetime
