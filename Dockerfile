FROM node:22-alpine AS frontend-builder
ARG FRONTEND_DIR=diveteca-crm-frontend
WORKDIR /app
COPY ${FRONTEND_DIR}/package*.json ./
RUN npm install
COPY ${FRONTEND_DIR}/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:22-alpine AS backend-builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ unixodbc-dev
COPY diveteca-backend/package*.json ./
RUN npm ci
COPY diveteca-backend/ ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache wireguard-tools iproute2
RUN mkdir -p /app/data
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/dist ./dist
COPY --from=frontend-builder /app/dist ./dist/public
COPY diveteca-backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
