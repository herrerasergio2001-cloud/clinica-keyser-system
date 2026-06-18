FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci --include=dev

FROM dependencies AS build

WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

COPY apps/web ./apps/web
COPY shared ./shared

RUN npm run build -w apps/web

FROM node:22-alpine AS runtime

WORKDIR /app/apps/web

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# The standalone tree contains the minimal package.json and node_modules
# required at runtime, so startup does not depend on /app/package.json.
COPY --from=build /app/apps/web/.next/standalone /app
COPY --from=build /app/apps/web/.next/static ./.next/static
COPY --from=build /app/apps/web/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
