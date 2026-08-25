FROM python:3.11-slim

# Herramientas de sistema (MySQL client, compilación de algunas libs).
# libreoffice-impress: conversión headless PPT/PPTX -> PDF para la vista
# previa de adjuntos (ver app/services/content.py, _convert_to_pdf_preview).
# Es la pieza más pesada de esta imagen (cientos de MB) — deliberado, no
# hay alternativa liviana para renderizar PPTX real sin ella.
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    curl \
    libreoffice-impress \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalación de dependencias (capa cacheable)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Código fuente (en dev se sobreescribe con bind mount)
COPY . .

EXPOSE 8000

# Healthcheck HTTP básico
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
