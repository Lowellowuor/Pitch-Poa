/**
 * Kenya Compliance Configuration
 * Centralized configuration for all compliance rules and thresholds
 */

module.exports = {
  // Tax Compliance
  tax: {
    vat: {
      rate: 0.16, // 16% VAT
      registrationThreshold: 5000000, // KES 5M annual turnover
      filingFrequency: 'monthly', // monthly or quarterly
      lateFilingPenalty: 10000, // KES 10,000 per month
      interestRate: 0.02 // 2% per month on late payments
    },
    
    incomeTax: {
      corporateRate: 0.30, // 30% for corporations
      individualRates: [
        { min: 0, max: 288000, rate: 0.10 },
        { min: 288001, max: 388000, rate: 0.25 },
        { min: 388001, max: 6000000, rate: 0.30 },
        { min: 6000001, max: 9600000, rate: 0.325 },
        { min: 9600001, max: Infinity, rate: 0.35 }
      ],
      personalRelief: 2400, // KES 2,400 per month
      insuranceRelief: 0.15, // 15% of premium
      pensionContributionLimit: 240000 // KES 240,000 per year
    },
    
    withholdingTax: {
      managementFees: 0.05, // 5%
      consultancyFees: 0.05, // 5%
      dividends: 0.05, // 5%
      interest: 0.15, // 15%
      rent: 0.10, // 10%
      threshold: 50000 // KES 50,000 per transaction
    },
    
    exciseDuty: {
      alcohol: 0.50, // 50%
      tobacco: 0.60, // 60%
      softDrinks: 0.15, // 15%
      cosmetics: 0.10 // 10%
    }
  },

  // Social Security (New SHIF - formerly NHIF)
  social: {
    shif: {
      rates: [
        { min: 0, max: 5999, amount: 150 },
        { min: 6000, max: 7999, amount: 300 },
        { min: 8000, max: 11999, amount: 400 },
        { min: 12000, max: 14999, amount: 500 },
        { min: 15000, max: 19999, amount: 600 },
        { min: 20000, max: 24999, amount: 750 },
        { min: 25000, max: 29999, amount: 850 },
        { min: 30000, max: 34999, amount: 900 },
        { min: 35000, max: 39999, amount: 950 },
        { min: 40000, max: 44999, amount: 1000 },
        { min: 45000, max: 49999, amount: 1100 },
        { min: 50000, max: 59999, amount: 1200 },
        { min: 60000, max: 69999, amount: 1300 },
        { min: 70000, max: 79999, amount: 1400 },
        { min: 80000, max: 89999, amount: 1500 },
        { min: 90000, max: 99999, amount: 1600 },
        { min: 100000, max: Infinity, amount: 1700 }
      ],
      employerShare: 0.50, // 50% of contribution
      employeeShare: 0.50 // 50% of contribution
    },
    
    nssf: {
      tierI: {
        min: 0,
        max: 6000,
        employeeRate: 0.06,
        employerRate: 0.06,
        maxContribution: 360 // 6000 * 0.06
      },
      tierII: {
        min: 6001,
        max: 18000,
        employeeRate: 0.06,
        employerRate: 0.06,
        maxContribution: 1080 // (18000-6000) * 0.06
      },
      totalMaxContribution: 1440 // 360 + 1080
    }
  },

  // Business Registration
  businessRegistration: {
    businessPermit: {
      renewalPeriod: 'yearly', // Annual renewal
      lateRenewalPenalty: 0.25, // 25% of permit fee
      categories: {
        small: { min: 0, max: 500000, fee: 1500 },
        medium: { min: 500001, max: 5000000, fee: 5000 },
        large: { min: 5000001, max: Infinity, fee: 15000 }
      }
    },
    
    singleBusinessPermit: {
      required: true,
      issuingBody: 'county_government',
      renewalDeadline: '31-12', // December 31st each year
      latePenalty: 0.50 // 50% of permit fee
    },
    
    kraPin: {
      applicationFee: 0, // Free
      processingTime: '3-5 days',
      validityPeriod: 'lifetime'
    }
  },

  // ETR (Electronic Tax Register) Requirements
  etr: {
    requiredThreshold: 100000, // KES 100,000 monthly turnover
    deviceTypes: ['wifi', 'gprs', '3g'],
    memorySize: '8MB minimum',
    batteryBackup: '72 hours minimum',
    receiptDetails: [
      'business_name',
      'business_pin',
      'receipt_number',
      'date_time',
      'items',
      'total_amount',
      'vat_amount',
      'qr_code'
    ]
  },

  // Data Protection (Data Protection Act 2019)
  dataProtection: {
    act: 'Data Protection Act 2019',
    registrationThreshold: 'any business processing personal data',
    dataTypes: [
      'personal_data',
      'sensitive_personal_data',
      'childrens_data'
    ],
    principles: [
      'lawful_fair_transparent',
      'purpose_limitation',
      'data_minimization',
      'accuracy',
      'storage_limitation',
      'integrity_confidentiality',
      'accountability'
    ],
    breachNotification: '72 hours',
    fines: {
      max: 5000000, // KES 5M or 1% of turnover
      criminal: 'up to 10 years imprisonment'
    }
  },

  // Consumer Protection
  consumerProtection: {
    warranty: {
      electronics: '12 months',
      furniture: '12 months',
      clothing: '6 months',
      food: '7 days',
      default: '6 months'
    },
    returnPolicy: {
      changeOfMind: '14 days',
      defective: '30 days',
      refundTimeline: '7 days'
    },
    receiptRequirements: [
      'business_name',
      'business_pin',
      'receipt_number',
      'date',
      'items',
      'unit_price',
      'total',
      'vat'
    ]
  },

  // Filing Deadlines (All in Kenya's timezone)
  deadlines: {
    vat: {
      monthly: '20th of following month',
      quarterly: '20th after quarter end'
    },
    incomeTax: {
      installment: '20th of 4th, 6th, 9th, 12th month',
      annual: '30th June',
      filing: '30th June'
    },
    withholdingTax: {
      monthly: '20th of following month'
    },
    payroll: {
      monthly: '9th of following month'
    },
    businessPermit: {
      renewal: '31st December'
    }
  },

  // Compliance Levels
  complianceLevels: {
    excellent: { min: 95, max: 100 }, // Fully compliant
    good: { min: 80, max: 94 }, // Mostly compliant
    fair: { min: 60, max: 79 }, // Partially compliant
    poor: { min: 0, max: 59 } // Non-compliant
  },

  // Alert Thresholds
  alerts: {
    daysBeforeDeadline: 30,
    daysBeforePermitExpiry: 60,
    lowComplianceScore: 70,
    criticalComplianceScore: 50
  }
};