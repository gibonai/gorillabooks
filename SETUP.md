# GorillaBooks Setup Guide

## Quick Start (Recommended)

The easiest way to get started is with Docker Compose:

```bash
# Clone the repository
git clone https://github.com/gibonai/gorillabooks.git
cd gorillabooks

# Run setup script (creates .env, installs dependencies)
./setup.sh

# Start everything with Docker
docker-compose up
```

That's it! The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## Manual Setup

If you prefer to run services individually:

### 1. Prerequisites

- Node.js 18+
- npm 9+
- MongoDB 7+ (or Docker)

### 2. Install Dependencies

```bash
# Root workspace
npm install

# This installs dependencies for both frontend and backend
```

### 3. Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env with your settings (defaults work for local dev)
```

### 4. Start MongoDB

```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=gorillabooks \
  -e MONGO_INITDB_ROOT_PASSWORD=dev-password \
  --name gorillabooks-mongo \
  mongo:7

# Or install MongoDB locally and start it
```

### 5. Start Backend

```bash
cd backend
npm run dev
```

Backend will start on http://localhost:3000

### 6. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will start on http://localhost:5173

## Environment Variables

### Development (default in .env)

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=dev-secret-key
MONGODB_URI=mongodb://gorillabooks:dev-password@localhost:27017/gorillabooks?authSource=admin
VITE_API_URL=http://localhost:3000
```

### Production

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<generate-strong-secret>
MONGODB_URI=mongodb://<user>:<pass>@<docdb-endpoint>:27017/gorillabooks?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false
VITE_API_URL=https://api.yourapp.com
```

## Development Commands

### Root Level
```bash
npm run dev          # Start both frontend and backend
npm run build        # Build both services
npm run lint         # Lint all workspaces
npm run docker:dev   # Start with Docker Compose
```

### Backend
```bash
cd backend
npm run dev          # Development with hot reload
npm run build        # TypeScript compilation
npm test             # Run tests
npm run lint         # Lint code
npm run type-check   # Type checking
```

### Frontend
```bash
cd frontend
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Lint code
npm run type-check   # Type checking
```

## First-Time Usage

1. **Start the application** (using any method above)

2. **Create an account**
   - Go to http://localhost:5173
   - You'll be redirected to the login page
   - Click "Sign up" to create a new account

3. **Start using GorillaBooks**
   - Create your first transaction
   - View your dashboard
   - Manage your accounting entries

## Troubleshooting

### Port Already in Use

If you see port conflict errors:

```bash
# Check what's using the port
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :27017 # MongoDB

# Kill the process
kill -9 <PID>
```

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
docker ps | grep mongo

# Check logs
docker logs gorillabooks-mongo

# Restart MongoDB
docker restart gorillabooks-mongo
```

### Frontend Can't Reach Backend

1. Check backend is running: `curl http://localhost:3000/health`
2. Check VITE_API_URL in .env
3. Check CORS settings in backend if running on different domains

### Dependencies Installation Failed

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
```

## Docker Compose Services

The `docker-compose.yml` includes:

- **mongodb**: MongoDB 7 database
- **backend**: Node.js API server
- **frontend**: Vite development server

All services are configured with health checks and proper dependencies.

## Production Deployment

See [README.md](./README.md#deployment) for AWS deployment instructions.

## Need Help?

- Check [README.md](./README.md) for full documentation
- Review [CLAUDE.md](./CLAUDE.md) for architecture details
- Open an issue on GitHub

---

Happy accounting! 🦍🍌
