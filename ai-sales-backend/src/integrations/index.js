/**
 * Integrations Module Index
 * Central export point for all third-party integrations
 * @module integrations
 */

const emailService = require('./email.service');
const smsService = require('./sms.service');
const whatsappService = require('./whatsapp.service');
const kraService = require('./kra.service');
const mpesaService = require('./mpesa.service');
const aiService = require('./ai.service');

module.exports = {
  emailService,
  smsService,
  whatsappService,
  kraService,
  mpesaService,
  aiService
};