# Multi-stage production build for SnapCard
FROM node:22-alpine AS builder

WORKDIR /app

# Install build tools for native addons (better-sqlite3, sharp)
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Production Image ---
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/.env* ./

# Prepare persistence directories
RUN mkdir -p data uploads/photos uploads/generated

EXPOSE 3001

VOLUME ["/app/data", "/app/uploads"]

CMD ["npm", "start"]
