from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserProfile, UserPronouns, UserStatus


class RegisterIn(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    apellidos: str = Field(min_length=1, max_length=100)
    numero_cuenta: str = Field(min_length=4, max_length=20)
    nickname: str = Field(min_length=3, max_length=40)
    pin: str = Field(min_length=4, max_length=32)
    correo_institucional: EmailStr | None = None
    pronombres: UserPronouns = UserPronouns.prefiero_no_decir
    acepta_reglas: bool

    @field_validator("acepta_reglas")
    @classmethod
    def must_accept_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Debe aceptar las reglas y el aviso de privacidad para registrarse.")
        return v

    @field_validator("nickname")
    @classmethod
    def nickname_charset(cls, v: str) -> str:
        v_stripped = v.strip()
        if not v_stripped:
            raise ValueError("Nickname no puede estar vacío.")
        return v_stripped


class LoginIn(BaseModel):
    numero_cuenta: str
    pin: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    apellidos: str
    numero_cuenta: str
    nickname: str
    correo_institucional: str | None
    estado: UserStatus
    perfil: UserProfile | None
    pronombres: UserPronouns
    is_admin: bool
    terms_accepted_at: datetime
    created_at: datetime
