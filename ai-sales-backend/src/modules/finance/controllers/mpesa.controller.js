const mpesaService = require('../services/external-apis/mpesa-api.service');
const transactionService = require('../services/transaction.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class MpesaController {
  /**
   * Initiate STK Push (Lipa Na M-PESA Online)
   * @route POST /api/v1/finance/mpesa/stk-push
   */
  stkPush = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { phoneNumber, amount, accountReference, transactionDesc } = req.body;

    const result = await mpesaService.stkPush({
      businessId,
      phoneNumber,
      amount,
      accountReference,
      transactionDesc
    });

    // Save transaction record
    await transactionService.createTransaction({
      businessId,
      type: 'mpesa_payment',
      reference: result.MerchantRequestID,
      amount,
      status: 'pending',
      metadata: result
    });

    return ApiResponse.success(res, result, 'STK Push initiated successfully');
  });

  /**
   * Query STK Push status
   * @route GET /api/v1/finance/mpesa/stk-status/:checkoutRequestId
   */
  queryStkStatus = asyncHandler(async (req, res) => {
    const { checkoutRequestId } = req.params;

    const status = await mpesaService.queryStkStatus(checkoutRequestId);

    return ApiResponse.success(res, status, 'STK status retrieved');
  });

  /**
   * C2B (Customer to Business) registration
   * @route POST /api/v1/finance/mpesa/c2b/register
   */
  registerC2B = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { shortCode, responseType, confirmationUrl, validationUrl } = req.body;

    const result = await mpesaService.registerC2B({
      shortCode,
      responseType,
      confirmationUrl,
      validationUrl
    });

    return ApiResponse.success(res, result, 'C2B URLs registered successfully');
  });

  /**
   * C2B simulation (for testing)
   * @route POST /api/v1/finance/mpesa/c2b/simulate
   */
  simulateC2B = asyncHandler(async (req, res) => {
    const { shortCode, amount, msisdn, billRefNumber } = req.body;

    const result = await mpesaService.simulateC2B({
      shortCode,
      amount,
      msisdn,
      billRefNumber
    });

    return ApiResponse.success(res, result, 'C2B simulation completed');
  });

  /**
   * B2C (Business to Customer) payment
   * @route POST /api/v1/finance/mpesa/b2c/payment
   */
  b2cPayment = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { phoneNumber, amount, command, remarks, occasion } = req.body;

    const result = await mpesaService.b2cPayment({
      businessId,
      phoneNumber,
      amount,
      command,
      remarks,
      occasion
    });

    // Save transaction
    await transactionService.createTransaction({
      businessId,
      type: 'mpesa_b2c',
      reference: result.ConversationID,
      amount,
      status: 'processing',
      metadata: result
    });

    return ApiResponse.success(res, result, 'B2C payment initiated');
  });

  /**
   * B2B (Business to Business) payment
   * @route POST /api/v1/finance/mpesa/b2b/payment
   */
  b2bPayment = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { receiverShortCode, amount, command, remarks } = req.body;

    const result = await mpesaService.b2bPayment({
      businessId,
      receiverShortCode,
      amount,
      command,
      remarks
    });

    return ApiResponse.success(res, result, 'B2B payment initiated');
  });

  /**
   * Transaction status query
   * @route POST /api/v1/finance/mpesa/transaction-status
   */
  queryTransactionStatus = asyncHandler(async (req, res) => {
    const { transactionId, command } = req.body;

    const status = await mpesaService.queryTransactionStatus({
      transactionId,
      command
    });

    return ApiResponse.success(res, status, 'Transaction status retrieved');
  });

  /**
   * Account balance query
   * @route GET /api/v1/finance/mpesa/balance
   */
  getAccountBalance = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { shortCode } = req.query;

    const balance = await mpesaService.getAccountBalance(shortCode);

    return ApiResponse.success(res, balance, 'Account balance retrieved');
  });

  /**
   * Reverse transaction
   * @route POST /api/v1/finance/mpesa/reverse
   */
  reverseTransaction = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { transactionId, amount, receiverParty } = req.body;

    const result = await mpesaService.reverseTransaction({
      transactionId,
      amount,
      receiverParty
    });

    return ApiResponse.success(res, result, 'Transaction reversal initiated');
  });

  /**
   * Get M-PESA statements
   * @route GET /api/v1/finance/mpesa/statements
   */
  getStatements = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate, format = 'json' } = req.query;

    const statements = await mpesaService.getStatements({
      businessId,
      startDate,
      endDate,
      format
    });

    return ApiResponse.success(res, statements, 'M-PESA statements retrieved');
  });

  /**
   * Validate M-PESA transaction (webhook handler)
   * @route POST /api/v1/finance/mpesa/validate
   */
  validateTransaction = asyncHandler(async (req, res) => {
    const { transaction } = req.body;

    const validation = await mpesaService.validateTransaction(transaction);

    return ApiResponse.success(res, validation, 'Transaction validated');
  });

  /**
   * Confirm M-PESA transaction (webhook handler)
   * @route POST /api/v1/finance/mpesa/confirm
   */
  confirmTransaction = asyncHandler(async (req, res) => {
    const { transaction } = req.body;

    const confirmation = await mpesaService.confirmTransaction(transaction);

    return ApiResponse.success(res, confirmation, 'Transaction confirmed');
  });

  /**
   * Get M-PESA transaction by reference
   * @route GET /api/v1/finance/mpesa/transaction/:reference
   */
  getTransactionByReference = asyncHandler(async (req, res) => {
    const { reference } = req.params;

    const transaction = await mpesaService.getTransactionByReference(reference);

    return ApiResponse.success(res, transaction, 'Transaction retrieved');
  });

  /**
   * Get M-PESA API rate limits
   * @route GET /api/v1/finance/mpesa/rate-limits
   */
  getRateLimits = asyncHandler(async (req, res) => {
    const limits = await mpesaService.getRateLimits();

    return ApiResponse.success(res, limits, 'Rate limits retrieved');
  });

  /**
   * M-PESA webhook receiver
   * @route POST /api/v1/finance/mpesa/webhook
   */
  webhook = asyncHandler(async (req, res) => {
    const { body } = req;

    const result = await mpesaService.handleWebhook(body);

    return ApiResponse.success(res, result, 'Webhook processed');
  });

  /**
   * Generate M-PESA QR code
   * @route POST /api/v1/finance/mpesa/qr
   */
  generateQRCode = asyncHandler(async (req, res) => {
    const { merchantName, refNo, amount, size = '300' } = req.body;

    const qrCode = await mpesaService.generateQRCode({
      merchantName,
      refNo,
      amount,
      size
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(qrCode);
  });

  /**
   * Get M-PESA transaction types
   * @route GET /api/v1/finance/mpesa/transaction-types
   */
  getTransactionTypes = asyncHandler(async (req, res) => {
    const types = await mpesaService.getTransactionTypes();

    return ApiResponse.success(res, types, 'Transaction types retrieved');
  });

  /**
   * Validate callback URL
   * @route POST /api/v1/finance/mpesa/validate-callback
   */
  validateCallbackUrl = asyncHandler(async (req, res) => {
    const { url } = req.body;

    const validation = await mpesaService.validateCallbackUrl(url);

    return ApiResponse.success(res, validation, 'Callback URL validated');
  });

  /**
   * Get transaction by M-PESA receipt
   * @route GET /api/v1/finance/mpesa/receipt/:receiptNumber
   */
  getTransactionByReceipt = asyncHandler(async (req, res) => {
    const { receiptNumber } = req.params;

    const transaction = await mpesaService.getTransactionByReceipt(receiptNumber);

    return ApiResponse.success(res, transaction, 'Transaction retrieved');
  });

  /**
   * Tax compliance check for M-PESA transactions
   * @route GET /api/v1/finance/mpesa/tax-compliance
   */
  getTaxCompliance = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const compliance = await mpesaService.getTaxCompliance(businessId, period);

    return ApiResponse.success(res, compliance, 'Tax compliance data retrieved');
  });
}

module.exports = new MpesaController();