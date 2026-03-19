/**
 * Integrations Configuration
 * Centralized configuration for all third-party services
 */

const config = {
  // Email Configuration (SendGrid)
  email: {
    provider: process.env.EMAIL_PROVIDER || 'sendgrid',
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'noreply@pitch-poa.com',
    fromName: process.env.FROM_NAME || 'Pitch Poa',
    templates: {
      welcome: 'd-welcome-template-id',
      invoice: 'd-invoice-template-id',
      verification: 'd-verification-template-id',
      marketing: 'd-marketing-template-id'
    }
  },

  // SMS Configuration (Africa's Talking)
  sms: {
    provider: process.env.SMS_PROVIDER || 'africastalking',
    username: process.env.AT_USERNAME,
    apiKey: process.env.AT_API_KEY,
    senderId: process.env.SMS_SENDER_ID || 'PitchPoa',
    webhookUrl: process.env.SMS_WEBHOOK_URL
  },

  // WhatsApp Configuration (Twilio)
  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || 'twilio',
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_WHATSAPP_NUMBER,
    businessProfile: {
      about: process.env.WHATSAPP_ABOUT || 'Pitch Poa - AI Sales for Small Vendors'
    }
  },

  // KRA Integration
  kra: {
    baseUrl: process.env.KRA_API_URL || 'https://kra.go.ke/api',
    clientId: process.env.KRA_CLIENT_ID,
    clientSecret: process.env.KRA_CLIENT_SECRET,
    pin: process.env.KRA_PIN,
    timeout: 30000,
    retryAttempts: 3
  },

  // M-Pesa Configuration (Safaricom)
  mpesa: {
    environment: process.env.MPESA_ENV || 'sandbox',
    consumerKey: process.env.MPESA_CONSUMER_KEY,
    consumerSecret: process.env.MPESA_CONSUMER_SECRET,
    passkey: process.env.MPESA_PASSKEY,
    shortCode: process.env.MPESA_SHORT_CODE,
    callbackUrl: process.env.MPESA_CALLBACK_URL,
    timeoutUrl: process.env.MPESA_TIMEOUT_URL,
    resultUrl: process.env.MPESA_RESULT_URL
  },

  // AI Services Configuration
  ai: {
    provider: process.env.AI_PROVIDER || 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: 500,
      temperature: 0.7
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY,
      models: {
        sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
        translation: 'Helsinki-NLP/opus-mt-en-sw'
      }
    }
  },

  // Retry Configuration
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  }
};

module.exports = config;