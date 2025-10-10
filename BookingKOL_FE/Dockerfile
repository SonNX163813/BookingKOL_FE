
# Chỉ copy lockfile để cache npm ci
COPY package.json package-lock.json ./

# ĐẢM BẢO cài devDependencies (đừng set NODE_ENV=production ở đây)
RUN npm ci

# Copy code
COPY . .

# Biến môi trường cho Vite (tùy bạn)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE=${VITE_API_BASE_URL}

# Phòng ngừa quyền thực thi cho các bin script (bao gồm vite)
RUN chmod +x node_modules/.bin/* || true

# Build FE
RUN npm run build

# ---------- Runtime (nginx) ----------
FROM nginx:1.27-alpine

# (Nếu bạn mount default.conf bằng docker-compose, KHÔNG cần COPY file cấu hình vào image)
# COPY nginx/default.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html