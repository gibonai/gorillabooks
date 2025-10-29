# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GorillaBooks is a full-stack accounting web application that implements GAAP-compliant double-entry bookkeeping. Built as a demonstration of modern web development and AI-assisted coding, it features user authentication, persistent data storage, and a clean React interface.

## Architecture

This is a monorepo with separate backend and frontend workspaces:

### Backend (Node.js/Express/TypeScript)

- **src/config/**: Database connection and environment configuration
- **src/models/**: Mongoose schemas for User and Transaction
- **src/controllers/**: Request handlers for auth and transactions
- **src/middleware/**: Authentication (JWT) and error handling
- **src/routes/**: API route definitions
- **src/index.ts**: Express app setup and server initialization

### Frontend (React/Vite/TypeScript)

- **src/components/**: React components
  - **Dashboard.tsx**: Financial overview with account totals and net income
  - **TransactionForm.tsx**: Double-entry transaction creation with validation
  - **TransactionList.tsx**: Transaction history with filtering and deletion
  - **ui/**: Reusable UI components (shadcn/ui based)
- **src/pages/**: Page components (Login, Signup)
- **src/contexts/**: React contexts (AuthContext for authentication)
- **src/hooks/**: Custom hooks (useTransactions for API integration)
- **src/types/**: TypeScript type definitions
- **src/utils/**: Utility functions (API client with axios)

### Data Model

**User** (MongoDB collection: `users`):
- email (unique), password (hashed), name
- Authentication via JWT tokens

**Transaction** (MongoDB collection: `transactions`):
- userId (reference to User), date, description
- entries[] - Array of AccountingEntry objects
- Validation: debits must equal credits

**AccountingEntry** (embedded in Transaction):
- type (debit/credit), gaapCategory, gaapSubcategory, amount
- Optional: vendor, tags, notes

**GAAP Categories**: Assets, Liabilities, Equity, Revenue, Expenses with predefined subcategories

## Development Commands

### Root Level (Monorepo)
```bash
npm run dev          # Run both frontend and backend in development
npm run build        # Build both services
npm run lint         # Lint all workspaces
npm run docker:dev   # Start with Docker Compose
```

### Backend
```bash
cd backend
npm run dev          # Development with hot reload (tsx watch)
npm run build        # TypeScript compilation
npm test             # Run Jest tests
npm run lint         # ESLint
npm run type-check   # TypeScript type checking
```

### Frontend
```bash
cd frontend
npm run dev          # Vite dev server on port 5173
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript type checking
```

## Key Technical Details

### Authentication
- JWT-based authentication with bcrypt password hashing
- Tokens stored in localStorage, sent via Authorization header
- Protected routes redirect to /login when unauthenticated
- Auth state managed via React Context

### Database
- **Local Development**: MongoDB 7 via Docker (port 27017)
- **Production**: AWS DocumentDB (MongoDB-compatible)
- Connection via Mongoose ODM
- Indexes on userId and date fields for query performance

### API Endpoints

**Auth:**
- POST `/api/auth/signup` - Create account
- POST `/api/auth/login` - Login and get JWT
- GET `/api/auth/me` - Get current user (requires auth)

**Transactions:**
- POST `/api/transactions` - Create transaction (requires auth)
- GET `/api/transactions` - Get all user transactions (requires auth)
- GET `/api/transactions/:id` - Get single transaction (requires auth)
- DELETE `/api/transactions/:id` - Delete transaction (requires auth)

### Deployment
- Docker containers for frontend and backend
- GitHub Actions CI/CD for linting, testing, building, and deploying
- AWS deployment ready (ECR for images, ECS/Fargate for hosting)
- Environment variables for configuration (see .env.example)

### Testing
- Backend: Jest with ts-jest for unit/integration tests
- Coverage thresholds: 70% branches/functions/lines/statements
- Frontend: Type checking with TypeScript

## Important Notes

- Reports feature has been removed (no Reports tab)
- All transactions use MongoDB `_id` field (not `id`)
- Double-entry validation enforced at both frontend and backend
- CORS enabled for local development (backend allows frontend origin)
- Production builds use multi-stage Docker images for optimization
