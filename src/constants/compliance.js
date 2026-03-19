module.exports = {
  TAX_RATES: {
    VAT: 0.16,
    CORPORATE_TAX: 0.30,
    WITHHOLDING: {
      MANAGEMENT_FEES: 0.05,
      CONSULTANCY: 0.05,
      DIVIDENDS: 0.05,
      INTEREST: 0.15,
      RENT: 0.10
    }
  },
  
  SOCIAL_RATES: {
    NSSF_TIER1: 6000,
    NSSF_TIER2: 18000,
    NSSF_RATE: 0.06
  },
  
  COMPLIANCE_LEVELS: {
    EXCELLENT: { min: 95, max: 100 },
    GOOD: { min: 80, max: 94 },
    FAIR: { min: 60, max: 79 },
    POOR: { min: 0, max: 59 }
  },
  
  DEADLINES: {
    VAT: '20th of following month',
    INCOME_TAX: '30th June',
    BUSINESS_PERMIT: '31st December'
  }
};
