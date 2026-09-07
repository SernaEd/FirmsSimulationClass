from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.streak import StreakDayStatus

class SimpleUserOut(BaseModel):
    nombre: str
    apellidos: str
    numero_cuenta: str

class StreakEvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    streak_day_id: int
    user_id: int
    user: SimpleUserOut
    daily_exercise_id: Optional[int] = None
    solucion_path: str
    submitted_at: datetime


class StreakDayOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    fecha: date
    estado: StreakDayStatus
    evidence: Optional[StreakEvidenceOut] = None
