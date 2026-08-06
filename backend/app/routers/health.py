from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(tags=["health"])

TZ_CDMX = ZoneInfo("America/Mexico_City")


@router.get("/health")
def health():
    return {
        "status": "ok",
        "timestamp": datetime.now(TZ_CDMX).isoformat(),
    }


@router.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "database": "reachable",
        "timestamp": datetime.now(TZ_CDMX).isoformat(),
    }
