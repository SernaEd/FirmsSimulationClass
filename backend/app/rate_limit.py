"""Configuración compartida de rate limiting (slowapi).

Los límites concretos se aplican por decorador en cada endpoint.
Ver tabla consolidada en el plan §13.1.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
