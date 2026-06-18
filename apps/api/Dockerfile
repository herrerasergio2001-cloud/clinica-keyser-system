FROM node:22-alpine AS dependencies

WORKDIR /app

# Prisma 5 requires OpenSSL to detect and load the correct Linux engine.
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci --include=dev

FROM dependencies AS build

WORKDIR /app

COPY database ./database
COPY apps/api ./apps/api
COPY shared ./shared

# This runs inside Linux, never against node_modules generated on macOS.
RUN npm run prisma:generate
RUN npm run build -w apps/api

FROM node:22-alpine AS runtime

WORKDIR /app/apps/api

RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV API_PORT=3001

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/database /app/database

EXPOSE 3001

CMD ["node", "dist/main.js"]
