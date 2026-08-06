FROM node:20-alpine

WORKDIR /app

# Instalación de dependencias (capa cacheable)
COPY package.json package-lock.json* ./
RUN npm install

# Código fuente (en dev se sobreescribe con bind mount)
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
