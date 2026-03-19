class SocialComplianceService {
  async checkCompliance(businessId) {
    return {
      nssf: 'compliant',
      shif: 'compliant',
      lastPayment: '2024-02-15'
    };
  }
  
  calculateNSSF(grossPay) {
    const tier1 = Math.min(grossPay, 6000) * 0.06;
    const tier2 = Math.min(Math.max(grossPay - 6000, 0), 12000) * 0.06;
    
    return {
      employeeContribution: tier1 + tier2,
      employerContribution: tier1 + tier2,
      totalContribution: (tier1 + tier2) * 2
    };
  }
}

module.exports = new SocialComplianceService();
