const kraService = require('../integrations/kra/kra.service');
const TaxCalculator = require('./tax.calculator');

class TaxComplianceService {
  async checkCompliance(businessId) {
    // Implementation - we'll create this properly
    return {
      status: 'compliant',
      score: 85,
      lastFiling: '2024-02-20',
      nextDue: '2024-03-20'
    };
  }
  
  async calculateVAT(sales, purchases) {
    return TaxCalculator.calculateVAT(sales, purchases);
  }
  
  async calculatePAYE(grossPay) {
    return TaxCalculator.calculatePAYE(grossPay);
  }
}

module.exports = new TaxComplianceService();
