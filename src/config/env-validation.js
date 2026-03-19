const envalid = require('envalid');
const { str, port, url, num } = envalid;

const validateEnv = () => {
  return envalid.cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
    PORT: port({ default: 3000 }),
    
    // Database
    MONGODB_URI: str(),
    
    // JWT
    JWT_SECRET: str(),
    JWT_EXPIRES_IN: str({ default: '7d' }),
    
    // Email
    SENDGRID_API_KEY: str(),
    FROM_EMAIL: str({ default: 'noreply@pitch-poa.com' }),
    
    // SMS
    AT_USERNAME: str(),
    AT_API_KEY: str(),
    
    // M-Pesa
    MPESA_ENV: str({ choices: ['sandbox', 'production'] }),
    MPESA_CONSUMER_KEY: str(),
    MPESA_CONSUMER_SECRET: str(),
    MPESA_PASSKEY: str(),
    MPESA_SHORT_CODE: str(),
    MPESA_CALLBACK_URL: url(),
    
    // KRA
    KRA_API_URL: url(),
    KRA_CLIENT_ID: str(),
    KRA_CLIENT_SECRET: str(),
    
    // OpenAI
    OPENAI_API_KEY: str(),
    
    // Frontend URL for CORS
    FRONTEND_URL: url(),
    
    // Redis for caching/sessions (optional but recommended)
    REDIS_URL: str({ default: '' }),
    
    // Logging
    LOG_LEVEL: str({ choices: ['error', 'warn', 'info', 'debug'], default: 'info' }),
    
    // File upload
    MAX_FILE_SIZE: num({ default: 5242880 }),
    UPLOAD_PATH: str({ default: 'uploads/' }),
    
    // Webhook secrets
    MPESA_WEBHOOK_SECRET: str({ default: '' }),
    KRA_WEBHOOK_SECRET: str({ default: '' }),
    
    // Backup
    BACKUP_PATH: str({ default: 'backups/' })
  });
};

module.exports = validateEnv;
