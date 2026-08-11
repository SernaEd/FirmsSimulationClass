from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"
    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_minutes: int = 1440
    jwt_refresh_token_days: int = 7
    # Orígenes permitidos por CORS fuera de development (coma-separado, sin
    # barra final). En staging/producción no hay forma de adivinar el
    # dominio/puerto público del frontend, así que se lee de aquí.
    # Ej: ALLOWED_ORIGINS=http://203.0.113.10:3000,https://calculo3.ejemplo.mx
    allowed_origins: str = ""
    # Secreto para POST /auth/bootstrap-admin (crea el primer admin de un
    # ambiente sin depender de que ya exista otro admin que lo apruebe).
    # Vacío = endpoint deshabilitado (responde 404). Ver .env.example.
    admin_bootstrap_token: str = ""

    @property
    def cors_origins(self) -> List[str]:
        if self.environment == "development":
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


settings = Settings()
