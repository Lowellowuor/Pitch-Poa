/**
 * Compliance Module Index
 * Central export point for all compliance services
 */

const KenyaComplianceService = require('./kenya-compliance.service');
const TaxComplianceService = require('./tax-compliance.service');
const BusinessRegistrationService = require('./business-registration.service');
const SocialComplianceService = require('./social-compliance.service');
const DataProtectionService = require('./data-protection.service');
const ConsumerProtectionService = require('./consumer-protection.service');

// Calculators
const TaxCalculator = require('./calculators/tax-calculator');
const SHIFCalculator = require('./calculators/shif-calculator');
const NSSFCalculator = require('./calculators/nssf-calculator');

// Validators
const KRAValidators = require('./validators/kra-validators');
const PermitValidators = require('./validators/permit-validators');
const DocumentValidators = require('./validators/document-validators');

// Reporting
const MonthlyReturns = require('./reporting/monthly-returns');
const AnnualReturns = require('./reporting/annual-returns');
const AuditTrail = require('./reporting/audit-trail');

// Initialize services
const kenyaCompliance = new KenyaComplianceService();
const taxCompliance = new TaxComplianceService();
const businessRegistration = new BusinessRegistrationService();
const socialCompliance = new SocialComplianceService();
const dataProtection = new DataProtectionService();
const consumerProtection = new ConsumerProtectionService();

module.exports = {
  // Main service
  kenyaCompliance,
  
  // Individual services
  taxCompliance,
  businessRegistration,
  socialCompliance,
  dataProtection,
  consumerProtection,
  
  // Calculators
  calculators: {
    TaxCalculator,
    SHIFCalculator,
    NSSFCalculator
  },
  
  // Validators
  validators: {
    KRAValidators,
    PermitValidators,
    DocumentValidators
  },
  
  // Reporting
  reporting: {
    MonthlyReturns,
    AnnualReturns,
    AuditTrail
  }
};