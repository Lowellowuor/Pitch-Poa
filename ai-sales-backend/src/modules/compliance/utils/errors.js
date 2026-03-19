/**
 * Compliance Error Classes
 * Custom errors for compliance module
 */

class ComplianceError extends Error {
  constructor(message, originalError = null) {
    super(message);
    this.name = 'ComplianceError';
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }
}

class TaxComplianceError extends ComplianceError {
  constructor(message, originalError = null) {
    super(message, originalError);
    this.name = 'TaxComplianceError';
  }
}

class RegistrationError extends ComplianceError {
  constructor(message, originalError = null) {
    super(message, originalError);
    this.name = 'RegistrationError';
  }
}

class DataProtectionError extends ComplianceError {
  constructor(message, originalError = null) {
    super(message, originalError);
    this.name = 'DataProtectionError';
  }
}

class SocialComplianceError extends ComplianceError {
  constructor(message, originalError = null) {
    super(message, originalError);
    this.name = 'SocialComplianceError';
  }
}

module.exports = {
  ComplianceError,
  TaxComplianceError,
  RegistrationError,
  DataProtectionError,
  SocialComplianceError
};