from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.rate_limit import limiter
from app.routers import (
    admin_economy,
    admin_teams,
    admin_users,
    auth,
    economy,
    health,
    teams,
)

app = FastAPI(
    title="Plataforma Cálculo 3",
    description="Backend de la plataforma de aprendizaje para Cálculo 3 (Ecuaciones Diferenciales).",
    version="0.4.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(admin_users.router)
app.include_router(admin_teams.router)
app.include_router(teams.router)
app.include_router(economy.router)
app.include_router(admin_economy.router)


@app.get("/")
def root():
    return {
        "name": "Plataforma Cálculo 3",
        "version": "0.4.0",
        "environment": settings.environment,
        "docs": "/docs",
    }
