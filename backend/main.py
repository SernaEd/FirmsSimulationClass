from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health

app = FastAPI(
    title="Plataforma Cálculo 3",
    description="Backend de la plataforma de aprendizaje para Cálculo 3 (Ecuaciones Diferenciales).",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)


@app.get("/")
def root():
    return {
        "name": "Plataforma Cálculo 3",
        "version": "0.1.0",
        "environment": settings.environment,
        "docs": "/docs",
    }
