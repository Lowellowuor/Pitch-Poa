const kraApiService = require('../services/external-apis/kra-api.service');
const kraEtimsService = require('../services/external-apis/kra-etims.service');
const taxCalculator = require('../services/tax-calculator.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class TaxesController {
  /**
   * Get KRA PIN status
   * @route GET /api/v1/finance/taxes/pin-status
   */
  getPINStatus = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { pin } = req.query;

    const status = await kraApiService.getPINStatus(pin || businessId);

    return ApiResponse.success(res, status, 'PIN status retrieved');
  });

  /**
   * Register for tax obligations
   * @route POST /api/v1/finance/taxes/register-obligations
   */
  registerObligations = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { pin, obligations } = req.body;

    const registration = await kraApiService.registerObligations({
      pin: pin || businessId.pin,
      obligations
    });

    return ApiResponse.success(res, registration, 'Tax obligations registered');
  });

  /**
   * File VAT return
   * @route POST /api/v1/finance/taxes/vat/file
   */
  fileVATReturn = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period, sales, purchases, exports } = req.body;

    const vatReturn = await kraApiService.fileVATReturn({
      businessId,
      period,
      sales,
      purchases,
      exports
    });

    return ApiResponse.success(res, vatReturn, 'VAT return filed');
  });

  /**
   * File income tax return
   * @route POST /api/v1/finance/taxes/income/file
   */
  fileIncomeTax = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { year, income, expenses, deductions } = req.body;

    const taxReturn = await kraApiService.fileIncomeTax({
      businessId,
      year,
      income,
      expenses,
      deductions
    });

    return ApiResponse.success(res, taxReturn, 'Income tax return filed');
  });

  /**
   * File PAYE return
   * @route POST /api/v1/finance/taxes/paye/file
   */
  filePAYEReturn = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period, employees } = req.body;

    const payeReturn = await kraApiService.filePAYEReturn({
      businessId,
      period,
      employees
    });

    return ApiResponse.success(res, payeReturn, 'PAYE return filed');
  });

  /**
   * Get tax compliance certificate
   * @route GET /api/v1/finance/taxes/tcc
   */
  getTCC = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { year } = req.query;

    const tcc = await kraApiService.getTCC(businessId, year);

    return ApiResponse.success(res, tcc, 'Tax compliance certificate retrieved');
  });

  /**
   * Apply for TCC
   * @route POST /api/v1/finance/taxes/tcc/apply
   */
  applyForTCC = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { year } = req.body;

    const application = await kraApiService.applyForTCC(businessId, year);

    return ApiResponse.success(res, application, 'TCC application submitted');
  });

  /**
   * Register eTIMS device
   * @route POST /api/v1/finance/taxes/etims/register
   */
  registerETIMS = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { deviceDetails } = req.body;

    const registration = await kraEtimsService.registerDevice({
      businessId,
      ...deviceDetails
    });

    return ApiResponse.success(res, registration, 'eTIMS device registered');
  });

  /**
   * Submit eTIMS invoice
   * @route POST /api/v1/finance/taxes/etims/invoice
   */
  submitETIMSInvoice = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const invoice = req.body;

    const submission = await kraEtimsService.submitInvoice({
      businessId,
      ...invoice
    });

    return ApiResponse.success(res, submission, 'eTIMS invoice submitted');
  });

  /**
   * Get eTIMS invoices
   * @route GET /api/v1/finance/taxes/etims/invoices
   */
  getETIMSInvoices = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const invoices = await kraEtimsService.getInvoices({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, invoices, 'eTIMS invoices retrieved');
  });

  /**
   * Get eTIMS stock control
   * @route GET /api/v1/finance/taxes/etims/stock
   */
  getETIMSStock = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const stock = await kraEtimsService.getStockControl(businessId);

    return ApiResponse.success(res, stock, 'eTIMS stock control retrieved');
  });

  /**
   * Calculate tax liability
   * @route POST /api/v1/finance/taxes/calculate
   */
  calculateTax = asyncHandler(async (req, res) => {
    const { income, expenses, type, period } = req.body;

    const calculation = await taxCalculator.calculateTax({
      income,
      expenses,
      type,
      period
    });

    return ApiResponse.success(res, calculation, 'Tax calculated');
  });

  /**
   * Get tax deadlines
   * @route GET /api/v1/finance/taxes/deadlines
   */
  getTaxDeadlines = asyncHandler(async (req, res) => {
    const { year } = req.query;

    const deadlines = await kraApiService.getTaxDeadlines(year);

    return ApiResponse.success(res, deadlines, 'Tax deadlines retrieved');
  });

  /**
   * Get tax rates
   * @route GET /api/v1/finance/taxes/rates
   */
  getTaxRates = asyncHandler(async (req, res) => {
    const { type } = req.query;

    const rates = await kraApiService.getTaxRates(type);

    return ApiResponse.success(res, rates, 'Tax rates retrieved');
  });

  /**
   * Get tax refund status
   * @route GET /api/v1/finance/taxes/refund-status
   */
  getRefundStatus = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { refundId } = req.query;

    const status = await kraApiService.getRefundStatus(businessId, refundId);

    return ApiResponse.success(res, status, 'Refund status retrieved');
  });

  /**
   * Apply for tax refund
   * @route POST /api/v1/finance/taxes/refund/apply
   */
  applyForRefund = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { type, amount, reason } = req.body;

    const application = await kraApiService.applyForRefund({
      businessId,
      type,
      amount,
      reason
    });

    return ApiResponse.success(res, application, 'Refund application submitted');
  });

  /**
   * Get tax audit trail
   * @route GET /api/v1/finance/taxes/audit-trail
   */
  getAuditTrail = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const audit = await kraApiService.getAuditTrail({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, audit, 'Audit trail retrieved');
  });

  /**
   * Get tax payments
   * @route GET /api/v1/finance/taxes/payments
   */
  getTaxPayments = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const payments = await kraApiService.getTaxPayments({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, payments, 'Tax payments retrieved');
  });

  /**
   * Make tax payment
   * @route POST /api/v1/finance/taxes/payments
   */
  makeTaxPayment = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { taxType, amount, paymentMethod, period } = req.body;

    const payment = await kraApiService.makeTaxPayment({
      businessId,
      taxType,
      amount,
      paymentMethod,
      period
    });

    return ApiResponse.success(res, payment, 'Tax payment made');
  });

  /**
   * Get tax obligations
   * @route GET /api/v1/finance/taxes/obligations
   */
  getTaxObligations = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const obligations = await kraApiService.getTaxObligations(businessId);

    return ApiResponse.success(res, obligations, 'Tax obligations retrieved');
  });

  /**
   * Get tax returns history
   * @route GET /api/v1/finance/taxes/returns
   */
  getTaxReturns = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { taxType, year } = req.query;

    const returns = await kraApiService.getTaxReturns({
      businessId,
      taxType,
      year: parseInt(year)
    });

    return ApiResponse.success(res, returns, 'Tax returns retrieved');
  });

  /**
   * Get tax return by ID
   * @route GET /api/v1/finance/taxes/returns/:returnId
   */
  getTaxReturnById = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { returnId } = req.params;

    const taxReturn = await kraApiService.getTaxReturnById(businessId, returnId);

    return ApiResponse.success(res, taxReturn, 'Tax return retrieved');
  });

  /**
   * Amend tax return
   * @route POST /api/v1/finance/taxes/returns/:returnId/amend
   */
  amendTaxReturn = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { returnId } = req.params;
    const { amendments } = req.body;

    const amended = await kraApiService.amendTaxReturn({
      businessId,
      returnId,
      amendments
    });

    return ApiResponse.success(res, amended, 'Tax return amended');
  });

  /**
   * Get eTIMS device status
   * @route GET /api/v1/finance/taxes/etims/device-status
   */
  getETIMSDeviceStatus = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const status = await kraEtimsService.getDeviceStatus(businessId);

    return ApiResponse.success(res, status, 'eTIMS device status retrieved');
  });

  /**
   * Get eTIMS sales summary
   * @route GET /api/v1/finance/taxes/etims/sales-summary
   */
  getETIMSSalesSummary = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const summary = await kraEtimsService.getSalesSummary(businessId, period);

    return ApiResponse.success(res, summary, 'eTIMS sales summary retrieved');
  });

  /**
   * Get eTIMS stock movement
   * @route GET /api/v1/finance/taxes/etims/stock-movement
   */
  getETIMSStockMovement = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const movements = await kraEtimsService.getStockMovement({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, movements, 'eTIMS stock movement retrieved');
  });

  /**
   * Validate eTIMS invoice
   * @route POST /api/v1/finance/taxes/etims/validate-invoice
   */
  validateETIMSInvoice = asyncHandler(async (req, res) => {
    const { invoice } = req.body;

    const validation = await kraEtimsService.validateInvoice(invoice);

    return ApiResponse.success(res, validation, 'eTIMS invoice validated');
  });

  /**
   * Get tax certificates
   * @route GET /api/v1/finance/taxes/certificates
   */
  getTaxCertificates = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const certificates = await kraApiService.getTaxCertificates(businessId);

    return ApiResponse.success(res, certificates, 'Tax certificates retrieved');
  });

  /**
   * Download tax certificate
   * @route GET /api/v1/finance/taxes/certificates/:certificateId/download
   */
  downloadTaxCertificate = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { certificateId } = req.params;

    const certificate = await kraApiService.downloadTaxCertificate(businessId, certificateId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=tax-certificate-${certificateId}.pdf`);
    res.send(certificate);
  });

  /**
   * Get tax summary
   * @route GET /api/v1/finance/taxes/summary
   */
  getTaxSummary = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { year } = req.query;

    const summary = await kraApiService.getTaxSummary(businessId, year);

    return ApiResponse.success(res, summary, 'Tax summary retrieved');
  });
}

module.exports = new TaxesController();