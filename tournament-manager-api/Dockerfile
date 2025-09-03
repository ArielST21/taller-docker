FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Instalar dependencias primero
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer puerto de la API
EXPOSE 3000

# Comando por defecto (lo sobreescribe docker-compose)
CMD ["npm", "run", "dev"]
