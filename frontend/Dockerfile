FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ARG SITE_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL SITE_URL=$SITE_URL
RUN npm run build
FROM nginx:stable-alpine
COPY --from=build /app/out /usr/share/nginx/html
COPY static.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
