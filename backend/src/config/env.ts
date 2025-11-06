import dotenv from 'dotenv';

dotenv.config();

// Construct MongoDB URI from individual env vars or use MONGODB_URI directly
const getMongodbUri = (): string => {
  // If MONGODB_URI is provided directly, use it
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  // Otherwise construct from individual components (used in AWS ECS with MongoDB Atlas)
  const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;
  if (DB_HOST && DB_USERNAME && DB_PASSWORD) {
    // URL-encode username and password to handle special characters
    const encodedUsername = encodeURIComponent(DB_USERNAME);
    const encodedPassword = encodeURIComponent(DB_PASSWORD);
    const database = DB_NAME || 'gorillabooks';
    // MongoDB Atlas connection string format
    return `mongodb+srv://${encodedUsername}:${encodedPassword}@${DB_HOST}/${database}?retryWrites=true&w=majority`;
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
