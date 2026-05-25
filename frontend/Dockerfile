FROM node:24-alpine AS builder

WORKDIR /app

ARG VITE_API_KEY=dev-notification-prefs-key-7f3e9a2b
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_OPENAPI_UI_URL=/api/docs
ARG VITE_GRAFANA_URL=/grafana
ARG VITE_GRAFANA_ADMIN_USER=admin
ARG VITE_GRAFANA_ADMIN_PASSWORD=admin

ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_OPENAPI_UI_URL=$VITE_OPENAPI_UI_URL
ENV VITE_GRAFANA_URL=$VITE_GRAFANA_URL
ENV VITE_GRAFANA_ADMIN_USER=$VITE_GRAFANA_ADMIN_USER
ENV VITE_GRAFANA_ADMIN_PASSWORD=$VITE_GRAFANA_ADMIN_PASSWORD

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run api:generate && npx tsc -b && npx vite build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
