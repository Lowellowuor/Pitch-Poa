/**
 * Compliance Module
 * Kenyan compliance services (tax, social, permits, data protection)
 */

const taxCompliance = require('./tax/tax.service');
const socialCompliance = require('./social/social.service');
const permitService = require('./permits/permit.service');
const dataProtection = require('./data-protection/data-protection.service');

module.exports = {
  taxCompliance,
  socialCompliance,
  permitService,
  dataProtection,
  
  // Main compliance checker
  async checkCompliance(businessId) {
    const [tax, social, permits, data] = await Promise.all([
      taxCompliance.checkCompliance(businessId),
      socialCompliance.checkCompliance(businessId),
      permitService.checkPermits(businessId),
      dataProtection.checkCompliance(businessId)
    ]);
    
    return { tax, social, permits, data };
  }
};
