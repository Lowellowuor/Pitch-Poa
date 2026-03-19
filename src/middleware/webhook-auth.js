const crypto = require('crypto');
const logger = require('../config/logger');

const verifyWebhookSignature = (secret) => {
  return (req, res, next) => {
    const signature = req.headers['x-webhook-signature'];
    
    if (!signature) {
      logger.warn('Missing webhook signature');
      return res.status(401).json({ error: 'Missing signature' });
    }

    const payload = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    try {
      const signatureBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);
      
      if (signatureBuffer.length !== expectedBuffer.length || 
          !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        logger.warn('Invalid webhook signature', {
          ip: req.ip,
          path: req.path
        });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } catch (error) {
      logger.error('Signature verification error:', error);
      return res.status(401).json({ error: 'Signature verification failed' });
    }

    next();
  };
};

// Specific webhook handlers
const mpesaWebhookAuth = (req, res, next) => {
  if (!process.env.MPESA_WEBHOOK_SECRET) {
    logger.warn('MPESA_WEBHOOK_SECRET not configured');
    return next();
  }
  return verifyWebhookSignature(process.env.MPESA_WEBHOOK_SECRET)(req, res, next);
};

const kraWebhookAuth = (req, res, next) => {
  if (!process.env.KRA_WEBHOOK_SECRET) {
    logger.warn('KRA_WEBHOOK_SECRET not configured');
    return next();
  }
  return verifyWebhookSignature(process.env.KRA_WEBHOOK_SECRET)(req, res, next);
};

module.exports = {
  mpesaWebhookAuth,
  kraWebhookAuth
};
