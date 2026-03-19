const axios = require('axios');
const config = require('../../config/api-config');

class KRAService {
  constructor() {
    this.client = axios.create({
      baseURL: config.kra.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.kra.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  /**
   * Get tax requirements for business type
   */
  async getTaxRequirements(businessType, estimatedRevenue) {
    try {
      // In production, this would call actual KRA API
      // For now, we'll simulate with documented KRA rates
      
      const taxRates = {
        'paye': this.getPAYERates(estimatedRevenue),
        'vat': this.getVATRequirements(estimatedRevenue),
        'turnover': this.getTurnoverTax(estimatedRevenue),
        'corporate': this.getCorporateTax(estimatedRevenue),
      };

      return {
        registrationRequired: this.getRegistrationRequirements(businessType),
        taxObligations: taxRates,
        filingFrequency: this.getFilingFrequency(estimatedRevenue),
        penalties: this.getPenaltyStructure(),
        nextSteps: this.getNextSteps(businessType),
      };
    } catch (error) {
      console.error('KRA API Error:', error);
      return this.getFallbackTaxInfo(businessType);
    }
  }

  /**
   * Get business permit requirements
   */
  async getBusinessPermitRequirements(county, businessType) {
    try {
      // This would call county government APIs in production
      const permits = {
        nairobi: {
          singleBusinessPermit: 'KES 5,000 - 50,000 depending on size',
          healthCertificate: 'KES 2,000',
          foodHandling: businessType === 'food' ? 'KES 3,000' : 'Not required',
        },
        mombasa: {
          singleBusinessPermit: 'KES 3,000 - 40,000',
          healthCertificate: 'KES 1,500',
        },
      };

      return permits[county.toLowerCase()] || permits.nairobi;
    } catch (error) {
      console.error('Permit API Error:', error);
      return {
        error: 'Could not fetch permit data',
        suggestion: 'Visit your county government offices for permit information',
      };
    }
  }

  getPAYERates(monthlySalary) {
    // Current KRA PAYE rates
    if (monthlySalary <= 24000) return 0;
    if (monthlySalary <= 32333) return 0.25;
    return 0.30;
  }

  getVATRequirements(revenue) {
    const THRESHOLD = 5000000; // KES 5M annual
    return {
      required: revenue > THRESHOLD,
      rate: 0.16,
      threshold: THRESHOLD,
    };
  }

  getTurnoverTax(revenue) {
    const THRESHOLD = 1000000; // KES 1M
    if (revenue < THRESHOLD) {
      return {
        rate: 0.01, // 1% turnover tax
        applicable: true,
      };
    }
    return { applicable: false };
  }

  getCorporateTax(revenue) {
    if (revenue > 5000000) {
      return {
        rate: 0.30, // 30% corporate tax
        applicable: true,
      };
    }
    return { applicable: false };
  }

  getRegistrationRequirements(businessType) {
    const requirements = {
      general: [
        'Business name registration (eCitizen)',
        'PIN certificate',
        'Tax compliance certificate',
      ],
      retail: ['Single business permit', 'Health permit (if food)'],
      agriculture: ['Agriculture department registration'],
    };
    return requirements[businessType] || requirements.general;
  }

  getFilingFrequency(revenue) {
    if (revenue > 5000000) return 'monthly';
    if (revenue > 1000000) return 'quarterly';
    return 'annually';
  }

  getPenaltyStructure() {
    return {
      lateFiling: '5% of tax due + 2% per month',
      latePayment: '5% penalty + interest at prevailing rate',
      nonCompliance: 'Up to KES 1,000,000 fine or imprisonment',
    };
  }

  getNextSteps(businessType) {
    return [
      '1. Register business name on eCitizen',
      '2. Apply for KRA PIN if you don\'t have one',
      '3. Register for appropriate tax obligations',
      '4. Get county business permit',
      '5. Open business bank account',
    ];
  }

  getFallbackTaxInfo(businessType) {
    return {
      note: 'Using standard KRA rates (API unavailable)',
      turnoverTax: '1% for turnover < KES 1M',
      vat: '16% for turnover > KES 5M',
      corporateTax: '30% for registered companies',
      filing: 'Monthly/quarterly returns via iTax',
    };
  }
}

module.exports = new KRAService();