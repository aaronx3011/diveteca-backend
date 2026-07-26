FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ unixodbc-dev
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache wireguard-tools iproute2
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
