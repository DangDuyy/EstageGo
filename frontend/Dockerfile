# ---------- BUILD STAGE ----------
FROM node:20 AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Đặt ARG để lấy biến môi trường lúc build
ARG VITE_API_ROOT
ARG VITE_GOOGLE_MAP_API_KEY
ARG VITE_GOOGLE_CLIENT_ID

COPY . .

# Truyền biến môi trường vào build
ENV VITE_API_ROOT=$VITE_API_ROOT
ENV VITE_GOOGLE_MAP_API_KEY=$VITE_GOOGLE_MAP_API_KEY
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN yarn build

# ---------- SERVE STAGE ----------
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
