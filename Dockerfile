FROM node:20-bookworm-slim AS build

WORKDIR /app

ARG VITE_BASE_URL=/api
ARG VITE_PERFORMANCE_APP_URL=
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_PERFORMANCE_APP_URL=$VITE_PERFORMANCE_APP_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
