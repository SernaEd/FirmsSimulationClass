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

    @property
    def cors_origins(self) -> List[str]:
        if self.environment == "development":
            return ["http://localhost:3000", "http://127.0.0.1:3000"]
        return []


settings = Settings()
