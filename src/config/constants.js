/**
 * all values are frozen to prevent runtime modifications
 */
const constants = Object.freeze({
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  },

  // User Roles
  USER_ROLES: {
    ADMIN: 'admin',
    VENDOR: 'vendor',
    CUSTOMER: 'customer',
  },

  // Sales Status
  SALES_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    FAILED: 'failed',
  },

  // Payment Methods
  PAYMENT_METHODS: {
    CASH: 'cash',
    MPESA: 'mpesa',
    CARD: 'card',
    BANK_TRANSFER: 'bank_transfer',
    MOBILE_MONEY: 'mobile_money',
  },

  // AI Recommendation Types
  AI_RECOMMENDATION_TYPES: {
    PRODUCT: 'product',
    PRICE: 'price',
    INVENTORY: 'inventory',
    CUSTOMER: 'customer',
    MARKET: 'market',
  },

  // AI Prediction Confidence Levels
  AI_CONFIDENCE: {
    HIGH: 0.8,
    MEDIUM: 0.6,
    LOW: 0.4,
  },

  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
  },

  // Cache durations (in seconds)
  CACHE_DURATIONS: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    DAY: 86400, // 24 hours
    WEEK: 604800, // 7 days
  },

  // Regular Expressions
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[0-9+\-\s()]{10,15}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    OBJECT_ID: /^[0-9a-fA-F]{24}$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  },

  // File upload limits (in bytes)
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES: 10,
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'],
  },

  // Time periods (in days)
  TIME_PERIODS: {
    TODAY: 1,
    WEEK: 7,
    MONTH: 30,
    QUARTER: 90,
    YEAR: 365,
  },

  // API Rate Limits
  API_RATE_LIMITS: {
    PUBLIC: { window: 60000, max: 60 }, // 60 requests per minute
    AUTH: { window: 900000, max: 10 }, // 10 requests per 15 minutes
    AI: { window: 60000, max: 30 }, // 30 AI requests per minute
    ADMIN: { window: 60000, max: 200 }, // 200 admin requests per minute
  },

  // AI Service Configuration
  AI_SERVICE: {
    DEFAULT_TIMEOUT: 30000, // 30 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 second
    BATCH_SIZE: 100,
  },

  // Business Rules
  BUSINESS_RULES: {
    MIN_ORDER_AMOUNT: 10,
    MAX_ORDER_AMOUNT: 1000000,
    MIN_PASSWORD_LENGTH: 8,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Audit Actions
  AUDIT_ACTIONS: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    VIEW: 'VIEW',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    EXPORT: 'EXPORT',
    IMPORT: 'IMPORT',
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    EMAIL: 'email',
    SMS: 'sms',
    PUSH: 'push',
    IN_APP: 'in_app',
  },

  // System Events
  SYSTEM_EVENTS: {
    USER_REGISTERED: 'user.registered',
    USER_LOGGED_IN: 'user.logged_in',
    USER_LOGGED_OUT: 'user.logged_out',
    ORDER_CREATED: 'order.created',
    ORDER_UPDATED: 'order.updated',
    PAYMENT_PROCESSED: 'payment.processed',
    AI_PREDICTION_GENERATED: 'ai.prediction_generated',
    ERROR_OCCURRED: 'error.occurred',
  },
});

module.exports = constants;