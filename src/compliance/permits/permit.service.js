class PermitService {
  async checkPermits(businessId) {
    return {
      businessPermit: 'active',
      healthCertificate: 'active',
      expiryDate: '2024-12-31'
    };
  }
}

module.exports = new PermitService();
