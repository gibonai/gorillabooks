# Multi-stage build for GorillaBooks consolidated app
# Builds both frontend (React) and backend (Node.js) into a single container
# Uses npm workspaces - requires root package.json and package-lock.json

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy root workspace files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

RUN npm ci --workspace=frontend

COPY frontend/ ./frontend/
RUN npm run build --workspace=frontend

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy root workspace files
COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm ci --workspace=backend

COPY backend/ ./backend/
RUN npm run build --workspace=backend

# Stage 3: Production runtime
FROM node:18-alpine

WORKDIR /app

# Copy root workspace files for backend production deps
COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm ci --workspace=backend --omit=dev

COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy frontend built static files to be served by backend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 3000

USER node

CMD ["node", "backend/dist/index.js"]
