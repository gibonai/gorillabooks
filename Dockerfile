# Multi-stage build for GorillaBooks consolidated app
# Builds both frontend (React) and backend (Node.js) into a single container

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# Stage 3: Production runtime
FROM node:18-alpine

WORKDIR /app

# Copy backend dependencies and built code
COPY backend/package*.json ./
RUN npm ci --only=production

COPY --from=backend-builder /app/backend/dist ./dist

# Copy frontend built static files to be served by backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]
