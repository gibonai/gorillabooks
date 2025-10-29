# GorillaBooks 🦍

GorillaBooks is a web-based accounting application.  This application is intended to demonstrate [Gibon AI's](https://gibon.ai) agentic coding and proactive error correction capabilities.  You're welcome to fork and deploy this software for your own purposes.

**We make no GAAP compliance promises**



> Powerful accounting that doesn't monkey around

## Features

- 📊 **Double-Entry Bookkeeping** - Proper GAAP-compliant accounting with debits and credits
- 🏦 **GAAP Categories** - Assets, Liabilities, Equity, Revenue, and Expenses
- 🔐 **User Authentication** - Secure JWT-based authentication
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- ☁️ **AWS Compatible** - Cost-optimized deployment (~$117/month for 10 users)

## Tech Stack

### Backend
- **Node.js** with Express and TypeScript
- **MongoDB/DocumentDB** for data persistence
- **JWT** for authentication
- **Mongoose** for data modeling

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **React Router** for navigation
- **Axios** for API calls

### DevOps
- **Docker & Docker Compose** for containerization
- **GitHub Actions** for CI/CD
- **MongoDB** locally (AWS DocumentDB in production)

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose (for local development)
- AWS account (for production deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/gibonai/gorillabooks.git
   cd gorillabooks
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker Compose** (recommended)
   ```bash
   docker-compose up
   ```

   This will start:
   - MongoDB on port 27017
   - Backend API on port 3000
   - Frontend on port 5173

4. **Or run locally without Docker**

   Terminal 1 - Backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

   Terminal 2 - Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Terminal 3 - MongoDB:
   ```bash
   docker run -d -p 27017:27017 \
     -e MONGO_INITDB_ROOT_USERNAME=gorillabooks \
     -e MONGO_INITDB_ROOT_PASSWORD=dev-password \
     mongo:7
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health check: http://localhost:3000/health

### Building for Production

```bash
# Build both services
npm run build

# Or build individually
cd backend && npm run build
cd frontend && npm run build
```

## Project Structure

```
gorillabooks/
├── backend/               # Node.js/Express API
│   ├── src/
│   │   ├── config/       # Database and environment config
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth and error handling
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API routes
│   │   └── index.ts      # Entry point
│   ├── Dockerfile        # Production build
│   └── Dockerfile.dev    # Development build
│
├── frontend/             # React/Vite application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts (Auth)
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   ├── Dockerfile        # Production build
│   └── Dockerfile.dev    # Development build
│
├── .github/
│   └── workflows/        # CI/CD pipelines
├── docker-compose.yml    # Local development setup
└── package.json          # Workspace configuration
```

## API Documentation

### Authentication

**Signup**
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Get Current User**
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Transactions

**Create Transaction**
```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-15",
  "description": "Office supplies purchase",
  "entries": [
    {
      "type": "debit",
      "gaapCategory": "Expenses",
      "gaapSubcategory": "Office Supplies",
      "amount": 150.00
    },
    {
      "type": "credit",
      "gaapCategory": "Assets",
      "gaapSubcategory": "Cash",
      "amount": 150.00
    }
  ]
}
```

**Get All Transactions**
```http
GET /api/transactions
Authorization: Bearer <token>
```

**Delete Transaction**
```http
DELETE /api/transactions/:id
Authorization: Bearer <token>
```

## Deployment

### AWS Deployment

1. **Set up DocumentDB cluster**
   ```bash
   aws docdb create-db-cluster \
     --db-cluster-identifier gorillabooks-cluster \
     --engine docdb \
     --master-username admin \
     --master-user-password <password>
   ```

2. **Create ECR repositories**
   ```bash
   aws ecr create-repository --repository-name gorillabooks-backend
   aws ecr create-repository --repository-name gorillabooks-frontend
   ```

3. **Configure GitHub Secrets**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

4. **Push to main branch** - GitHub Actions will automatically build and deploy

### Environment Variables (Production)

```env
# Backend
NODE_ENV=production
PORT=3000
JWT_SECRET=<generate-secure-secret>
MONGODB_URI=mongodb://<user>:<password>@<docdb-endpoint>:27017/gorillabooks?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false

# Frontend (build time)
VITE_API_URL=https://api.yourapp.com
```

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend type checking
cd frontend
npm run type-check
```

### Linting

```bash
# Lint all workspaces
npm run lint

# Lint specific workspace
cd backend && npm run lint
cd frontend && npm run lint

# Auto-fix issues
npm run lint:fix
```

## Contributing

This is an open-source project. Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with AI-assisted coding capabilities
- UI components based on shadcn/ui
- Icons from Lucide React

---

Made with 🦍 and 🍌 by the GorillaBooks team
