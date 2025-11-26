require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 1337,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Admin
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@example.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  
  // Feature flags
  FLAG_NPS: process.env.FLAG_NPS !== 'false',
  FLAG_PROMOTE_EE: process.env.FLAG_PROMOTE_EE !== 'false',
  
  // API settings
  DEFAULT_LIMIT: parseInt(process.env.DEFAULT_LIMIT) || 25,
  MAX_LIMIT: parseInt(process.env.MAX_LIMIT) || 100,
  WITH_COUNT: process.env.WITH_COUNT !== 'false'
};