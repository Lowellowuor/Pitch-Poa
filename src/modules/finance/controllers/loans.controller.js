const hustlerFundService = require('../services/external-apis/hustler-fund.service');
const youthFundService = require('../services/external-apis/youth-fund.service');
const uwezoFundService = require('../services/external-apis/uwezo-fund.service');
const womanFundService = require('../services/external-apis/woman-fund.service');
const creditReferenceService = require('../services/external-apis/credit-reference.service');
const loanService = require('../services/loan.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class LoansController {
  /**
   * Check loan eligibility across all lenders
   * @route GET /api/v1/finance/loans/eligibility
   */
  checkEligibility = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { amount, purpose } = req.query;

    const eligibility = {
      hustlerFund: await hustlerFundService.checkEligibility(businessId, amount),
      youthFund: await youthFundService.checkEligibility(businessId, amount),
      uwezoFund: await uwezoFundService.checkEligibility(businessId, amount),
      womanFund: await womanFundService.checkEligibility(businessId, amount),
      banks: await loanService.checkBankEligibility(businessId, amount, purpose)
    };

    return ApiResponse.success(res, eligibility, 'Loan eligibility checked');
  });

  /**
   * Apply for Hustler Fund loan
   * @route POST /api/v1/finance/loans/hustler-fund/apply
   */
  applyHustlerFund = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { amount, repaymentPeriod } = req.body;

    // Check CRB first
    const crbStatus = await creditReferenceService.checkBusinessStatus(businessId);
    if (!crbStatus.clean) {
      return ApiResponse.error(res, {
        message: 'Business has negative CRB listing',
        details: crbStatus,
        statusCode: 400
      });
    }

    const application = await hustlerFundService.applyLoan({
      businessId,
      amount,
      repaymentPeriod
    });

    return ApiResponse.success(res, application, 'Hustler Fund application submitted');
  });

  /**
   * Check Hustler Fund loan status
   * @route GET /api/v1/finance/loans/hustler-fund/status/:applicationId
   */
  checkHustlerFundStatus = asyncHandler(async (req, res) => {
    const { applicationId } = req.params;

    const status = await hustlerFundService.checkLoanStatus(applicationId);

    return ApiResponse.success(res, status, 'Loan status retrieved');
  });

  /**
   * Apply for Youth Enterprise Fund
   * @route POST /api/v1/finance/loans/youth-fund/apply
   */
  applyYouthFund = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { amount, businessPlan, yearsInOperation } = req.body;

    // Verify youth status (18-35 years)
    const user = await User.findById(req.user.id);
    const age = this.calculateAge(user.dob);
    if (age < 18 || age > 35) {
      return ApiResponse.error(res, {
        message: 'Youth Fund only available for ages 18-35',
        statusCode: 400
      });
    }

    const application = await youthFundService.applyLoan({
      businessId,
      amount,
      businessPlan,
      yearsInOperation
    });

    return ApiResponse.success(res, application, 'Youth Fund application submitted');
  });

  /**
   * Apply for Uwezo Fund
   * @route POST /api/v1/finance/loans/uwezo-fund/apply
   */
  applyUwezoFund = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { amount, groupName, groupMembers } = req.body;

    // Uwezo Fund requires groups/women/chama
    if (!groupName || !groupMembers || groupMembers.length < 3) {
      return ApiResponse.error(res, {
        message: 'Uwezo Fund requires a group with minimum 3 members',
        statusCode: 400
      });
    }

    const application = await uwezoFundService.applyLoan({
      businessId,
      amount,
      groupName,
      groupMembers
    });

    return ApiResponse.success(res, application, 'Uwezo Fund application submitted');
  });

  /**
   * Apply for Women Enterprise Fund
   * @route POST /api/v1/finance/loans/woman-fund/apply
   */
  applyWomanFund = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { amount, businessType } = req.body;

    // Verify business is women-owned
    const business = await Business.findById(businessId);
    if (business.ownership !== 'women') {
      return ApiResponse.error(res, {
        message: 'Women Enterprise Fund requires women-owned business',
        statusCode: 400
      });
    }

    const application = await womanFundService.applyLoan({
      businessId,
      amount,
      businessType
    });

    return ApiResponse.success(res, application, 'Women Fund application submitted');
  });

  /**
   * Apply for bank loan
   * @route POST /api/v1/finance/loans/bank/apply
   */
  applyBankLoan = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { bank, amount, purpose, term, collateral } = req.body;

    // Get bank service based on selected bank
    const bankService = this.getBankService(bank);
    
    const application = await bankService.applyLoan({
      businessId,
      amount,
      purpose,
      term,
      collateral
    });

    return ApiResponse.success(res, application, 'Bank loan application submitted');
  });

  /**
   * Get loan products from all lenders
   * @route GET /api/v1/finance/loans/products
   */
  getLoanProducts = asyncHandler(async (req, res) => {
    const { amount, purpose } = req.query;

    const products = await loanService.getLoanProducts({
      amount,
      purpose
    });

    return ApiResponse.success(res, products, 'Loan products retrieved');
  });

  /**
   * Get loan repayment schedule
   * @route GET /api/v1/finance/loans/:loanId/schedule
   */
  getRepaymentSchedule = asyncHandler(async (req, res) => {
    const { loanId } = req.params;

    const schedule = await loanService.getRepaymentSchedule(loanId);

    return ApiResponse.success(res, schedule, 'Repayment schedule retrieved');
  });

  /**
   * Make loan repayment
   * @route POST /api/v1/finance/loans/:loanId/repay
   */
  makeRepayment = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { loanId } = req.params;
    const { amount, paymentMethod } = req.body;

    const repayment = await loanService.makeRepayment({
      businessId,
      loanId,
      amount,
      paymentMethod
    });

    return ApiResponse.success(res, repayment, 'Repayment processed');
  });

  /**
   * Get loan statements
   * @route GET /api/v1/finance/loans/:loanId/statements
   */
  getLoanStatements = asyncHandler(async (req, res) => {
    const { loanId } = req.params;
    const { startDate, endDate } = req.query;

    const statements = await loanService.getLoanStatements(loanId, { startDate, endDate });

    return ApiResponse.success(res, statements, 'Loan statements retrieved');
  });

  /**
   * Calculate loan affordability
   * @route POST /api/v1/finance/loans/calculate-affordability
   */
  calculateAffordability = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { amount, term, interestRate } = req.body;

    const affordability = await loanService.calculateAffordability({
      businessId,
      amount,
      term,
      interestRate
    });

    return ApiResponse.success(res, affordability, 'Affordability calculated');
  });

  /**
   * Get loan comparison
   * @route GET /api/v1/finance/loans/compare
   */
  compareLoans = asyncHandler(async (req, res) => {
    const { amount, term } = req.query;

    const comparison = await loanService.compareLoans({
      amount: parseFloat(amount),
      term: parseInt(term)
    });

    return ApiResponse.success(res, comparison, 'Loan comparison retrieved');
  });

  /**
   * Upload loan documents
   * @route POST /api/v1/finance/loans/documents
   */
  uploadDocuments = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { loanId, documentType } = req.body;
    const files = req.files;

    const documents = await loanService.uploadDocuments({
      businessId,
      loanId,
      documentType,
      files
    });

    return ApiResponse.success(res, documents, 'Documents uploaded');
  });

  /**
   * Get CRB report
   * @route GET /api/v1/finance/loans/crb-report
   */
  getCRBReport = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const report = await creditReferenceService.getBusinessReport(businessId);

    return ApiResponse.success(res, report, 'CRB report retrieved');
  });

  /**
   * Dispute CRB listing
   * @route POST /api/v1/finance/loans/crb-dispute
   */
  disputeCRBListing = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { listingId, reason, evidence } = req.body;

    const dispute = await creditReferenceService.disputeListing({
      businessId,
      listingId,
      reason,
      evidence
    });

    return ApiResponse.success(res, dispute, 'Dispute submitted');
  });

  /**
   * Get active loans
   * @route GET /api/v1/finance/loans/active
   */
  getActiveLoans = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const loans = await loanService.getActiveLoans(businessId);

    return ApiResponse.success(res, loans, 'Active loans retrieved');
  });

  /**
   * Get loan history
   * @route GET /api/v1/finance/loans/history
   */
  getLoanHistory = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { limit = 10 } = req.query;

    const history = await loanService.getLoanHistory(businessId, parseInt(limit));

    return ApiResponse.success(res, history, 'Loan history retrieved');
  });

  /**
   * Calculate loan interest
   * @route POST /api/v1/finance/loans/calculate-interest
   */
  calculateInterest = asyncHandler(async (req, res) => {
    const { principal, rate, term, type = 'reducing' } = req.body;

    const calculation = await loanService.calculateInterest({
      principal,
      rate,
      term,
      type
    });

    return ApiResponse.success(res, calculation, 'Interest calculated');
  });

  /**
   * Get loan defaulters
   * @route GET /api/v1/finance/loans/defaulters
   */
  getLoanDefaulters = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const defaulters = await loanService.getLoanDefaulters(businessId);

    return ApiResponse.success(res, defaulters, 'Loan defaulters retrieved');
  });

  /**
   * Request loan restructuring
   * @route POST /api/v1/finance/loans/:loanId/restructure
   */
  requestRestructuring = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { loanId } = req.params;
    const { newTerm, newRate, reason } = req.body;

    const restructuring = await loanService.requestRestructuring({
      businessId,
      loanId,
      newTerm,
      newRate,
      reason
    });

    return ApiResponse.success(res, restructuring, 'Restructuring request submitted');
  });

  /**
   * Get loan guarantees
   * @route GET /api/v1/finance/loans/:loanId/guarantees
   */
  getLoanGuarantees = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { loanId } = req.params;

    const guarantees = await loanService.getLoanGuarantees(businessId, loanId);

    return ApiResponse.success(res, guarantees, 'Loan guarantees retrieved');
  });

  /**
   * Add loan guarantee
   * @route POST /api/v1/finance/loans/:loanId/guarantees
   */
  addLoanGuarantee = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { loanId } = req.params;
    const { guarantorName, guarantorId, amount } = req.body;

    const guarantee = await loanService.addLoanGuarantee({
      businessId,
      loanId,
      guarantorName,
      guarantorId,
      amount
    });

    return ApiResponse.success(res, guarantee, 'Loan guarantee added');
  });

  /**
   * Get loan documents
   * @route GET /api/v1/finance/loans/:loanId/documents
   */
  getLoanDocuments = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { loanId } = req.params;

    const documents = await loanService.getLoanDocuments(businessId, loanId);

    return ApiResponse.success(res, documents, 'Loan documents retrieved');
  });

  /**
   * Download loan document
   * @route GET /api/v1/finance/loans/:loanId/documents/:documentId
   */
  downloadLoanDocument = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { loanId, documentId } = req.params;

    const document = await loanService.getLoanDocument(businessId, loanId, documentId);

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename=${document.filename}`);
    res.send(document.data);
  });

  /**
   * Get bank service by name
   */
  getBankService(bank) {
    const banks = {
      equity: 'equity-api.service',
      kcb: 'kcb-api.service',
      coop: 'coop-api.service',
      stanchart: 'stanchart-api.service',
      absa: 'absa-api.service'
    };
    
    return require(`../services/external-apis/${banks[bank]}`);
  }

  /**
   * Calculate age from DOB
   */
  calculateAge(dob) {
    const diff = Date.now() - new Date(dob).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }
}

module.exports = new LoansController();