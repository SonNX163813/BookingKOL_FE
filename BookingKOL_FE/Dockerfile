# ---------- Build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# Cài đúng theo lockfile
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Biến môi trường build cho Vite (mặc định /api để FE gọi cùng origin qua Nginx)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE=${VITE_API_BASE_URL}


# Build
RUN node ./node_modules/vite/bin/vite.js build

# ---------- Runtime (nginx) ----------
FROM nginx:1.27-alpine

# (nếu có file cấu hình nginx của bạn) copy vào:
# COPY nginx/default.conf /etc/nginx/conf.d/default.conf
ENV NODE_ENV=production
# Copy static build
COPY --from=build /app/dist /usr/share/nginx/html
