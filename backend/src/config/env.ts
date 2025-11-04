import dotenv from 'dotenv';

dotenv.config();

// Construct MongoDB URI from individual env vars or use MONGODB_URI directly
const getMongodbUri = (): string => {
  // If MONGODB_URI is provided directly, use it
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  // Otherwise construct from individual components (used in AWS ECS)
  const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD } = process.env;
  if (DB_HOST && DB_PORT && DB_USERNAME && DB_PASSWORD) {
    return `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`;
  }

  return '';
};

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: getMongodbUri(),
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  jwtExpiresIn: '7d',
} as const;

// Validate required environment variables
if (!config.mongodbUri) {
  console.error('Missing MongoDB configuration. Provide either MONGODB_URI or DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD');
  process.exit(1);
}
