FROM node:24-alpine AS builder

RUN apk add --no-cache openssl postgresql-client wget

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json nest-cli.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

FROM node:24-alpine

RUN apk add --no-cache openssl postgresql-client wget

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
