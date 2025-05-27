FROM node:18-alpine
# Copiar los archivos del proyecto al contenedor
WORKDIR /app
RUN npm install -g pnpm
COPY package*.json .

RUN pnpm install
COPY . .

EXPOSE 3000
CMD ["pnpm", "dev", "--host"]

