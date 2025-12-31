# =========================
# 1️⃣ Build stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy file dependency trước để cache
COPY package.json ./

# Cài FULL dependency (có devDependencies để build Babel)
RUN yarn install --frozen-lockfile

# Copy source
COPY . .

# Build bằng Babel
RUN yarn build


# =========================
# 2️⃣ Runtime stage
# =========================
FROM node:20-alpine

WORKDIR /app

# Copy package.json để biết metadata
COPY package.json ./

# Chỉ cài dependency production (NHẸ)
RUN yarn install --frozen-lockfile --production

# Copy code đã build từ stage builder
COPY --from=builder /app/build ./build

# Nếu bạn có file config / public thì copy thêm
# COPY --from=builder /app/public ./public

EXPOSE 8017

ENV BUILD_MODE=production

# Chạy app (đúng với script production)
CMD ["node", "build/src/server.js"]
