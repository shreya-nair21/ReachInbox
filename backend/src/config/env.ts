import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/reachinbox_db',
  
  REDIS_URL: process.env.REDIS_URL || undefined,
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6380', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  WORKER_CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  MIN_DELAY_BETWEEN_EMAILS: parseInt(process.env.MIN_DELAY_BETWEEN_EMAILS || '2000', 10),
  MAX_EMAILS_PER_HOUR_PER_SENDER: parseInt(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || '100', 10),

  ELASTICSEARCH_NODE: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
  ELASTICSEARCH_INDEX: process.env.ELASTICSEARCH_INDEX || 'emails',

  JWT_SECRET: process.env.JWT_SECRET || 'reachinbox_super_secret_jwt_key_2026',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',

  SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID || '',
  SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET || '',
  SLACK_REDIRECT_URI: process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/slack/callback',

  ETHEREAL_USER: process.env.ETHEREAL_USER || '',
  ETHEREAL_PASS: process.env.ETHEREAL_PASS || '',
};
