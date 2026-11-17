FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM nginx:stable-alpine
COPY --from=build /app/out /usr/share/nginx/html
COPY static.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
