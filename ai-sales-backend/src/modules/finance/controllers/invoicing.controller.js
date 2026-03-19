const invoicingService = require('../services/invoicing.service');
const kraEtimsService = require('../services/external-apis/kra-etims.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class InvoicingController {
  /**
   * Create invoice
   * @route POST /api/v1/finance/invoices
   */
  createInvoice = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const invoiceData = req.body;

    const invoice = await invoicingService.createInvoice(businessId, invoiceData);

    // If business is eTIMS registered, submit to KRA
    if (req.user.business?.etimsRegistered) {
      const etimsSubmission = await kraEtimsService.submitInvoice(invoice);
      invoice.etimsQRCode = etimsSubmission.qrCode;
      invoice.etimsNumber = etimsSubmission.invoiceNumber;
      await invoice.save();
    }

    return ApiResponse.created(res, invoice, 'Invoice created');
  });

  /**
   * Get invoices
   * @route GET /api/v1/finance/invoices
   */
  getInvoices = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { status, customer, startDate, endDate, page = 1, limit = 20 } = req.query;

    const invoices = await invoicingService.getInvoices(businessId, {
      status,
      customer,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    return ApiResponse.success(res, invoices, 'Invoices retrieved');
  });

  /**
   * Get invoice by ID
   * @route GET /api/v1/finance/invoices/:invoiceId
   */
  getInvoiceById = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { invoiceId } = req.params;

    const invoice = await invoicingService.getInvoiceById(businessId, invoiceId);

    return ApiResponse.success(res, invoice, 'Invoice retrieved');
  });

  /**
   * Update invoice
   * @route PATCH /api   * Update invoice
   * @route PATCH /api/v1/finance/invoices/:invoiceId
   */
  updateInvoice = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { invoiceId } = req.params;
    const updateData = req.body;

    const invoice = await invoicingService.updateInvoice(businessId, invoiceId, updateData);

    return ApiResponse.success(res, invoice, 'Invoice updated');
  });

  /**
   * Delete invoice
   * @route DELETE /api/v1/finance/invoices/:invoiceId
   */
  deleteInvoice = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { invoiceId } = req.params;

    await invoicingService.deleteInvoice(businessId, invoiceId);

    return ApiResponse.success(res, null, 'Invoice deleted');
  });

  /**
   * Send invoice via email
   * @route POST /api/v1/finance/invoices/:invoiceId/send
   */
  sendInvoice = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { invoiceId } = req.params;
    const { email, message } = req.body;

    const result = await invoicingService.sendInvoice({
      businessId,
      invoiceId,
      email,
      message
    });

    return ApiResponse.success(res, result, 'Invoice sent');
  });

  /**
   * Generate invoice PDF
   * @route GET /api/v1/finance/invoices/:invoiceId/pdf
   */
  generateInvoicePDF = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { invoiceId } = req.params;

    const pdf = await invoicingService.generateInvoicePDF(businessId, invoiceId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceId}.pdf`);
    res.send(pdf);
  });

  /**
   * Record invoice payment
   * @route POST /api/v1/finance/invoices/:invoiceId/payments
   */
  recordPayment = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { invoiceId } = req.params;
    const paymentData = req.body;

    const payment = await invoicingService.recordPayment({
      businessId,
      invoiceId,
      ...paymentData
    });

    return ApiResponse.success(res, payment, 'Payment recorded');
  });

  /**
   * Get invoice payments
   * @route GET /api/v1/finance/invoices/:invoiceId/payments
   */
  getInvoicePayments = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { invoiceId } = req.params;

    const payments = await invoicingService.getInvoicePayments(businessId, invoiceId);

    return ApiResponse.success(res, payments, 'Invoice payments retrieved');
  });

  /**
   * Create credit note
   * @route POST /api/v1/finance/invoices/:invoiceId/credit-note
   */
  createCreditNote = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { invoiceId } = req.params;
    const creditNoteData = req.body;

    const creditNote = await invoicingService.createCreditNote({
      businessId,
      invoiceId,
      ...creditNoteData
    });

    return ApiResponse.created(res, creditNote, 'Credit note created');
  });

  /**
   * Get invoice statistics
   * @route GET /api/v1/finance/invoices/statistics
   */
  getInvoiceStatistics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = 'month' } = req.query;

    const statistics = await invoicingService.getInvoiceStatistics(businessId, period);

    return ApiResponse.success(res, statistics, 'Invoice statistics retrieved');
  });

  /**
   * Get overdue invoices
   * @route GET /api/v1/finance/invoices/overdue
   */
  getOverdueInvoices = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const invoices = await invoicingService.getOverdueInvoices(businessId);

    return ApiResponse.success(res, invoices, 'Overdue invoices retrieved');
  });

  /**
   * Send payment reminders
   * @route POST /api/v1/finance/invoices/send-reminders
   */
  sendPaymentReminders = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { daysOverdue = 7 } = req.body;

    const reminders = await invoicingService.sendPaymentReminders(businessId, daysOverdue);

    return ApiResponse.success(res, reminders, 'Payment reminders sent');
  });

  /**
   * Get invoice aging report
   * @route GET /api/v1/finance/invoices/aging-report
   */
  getAgingReport = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { asAt } = req.query;

    const report = await invoicingService.getAgingReport(businessId, asAt);

    return ApiResponse.success(res, report, 'Aging report retrieved');
  });

  /**
   * Bulk create invoices
   * @route POST /api/v1/finance/invoices/bulk
   */
  bulkCreateInvoices = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { invoices } = req.body;

    const results = await invoicingService.bulkCreateInvoices(businessId, invoices);

    return ApiResponse.success(res, results, 'Bulk invoices created');
  });

  /**
   * Get invoice by number
   * @route GET /api/v1/finance/invoices/number/:invoiceNumber
   */
  getInvoiceByNumber = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { invoiceNumber } = req.params;

    const invoice = await invoicingService.getInvoiceByNumber(businessId, invoiceNumber);

    return ApiResponse.success(res, invoice, 'Invoice retrieved');
  });

  /**
   * Get customer invoices
   * @route GET /api/v1/finance/invoices/customer/:customerId
   */
  getCustomerInvoices = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { customerId } = req.params;

    const invoices = await invoicingService.getCustomerInvoices(businessId, customerId);

    return ApiResponse.success(res, invoices, 'Customer invoices retrieved');
  });

  /**
   * Get customer credit limit
   * @route GET /api/v1/finance/invoices/customer/:customerId/credit-limit
   */
  getCustomerCreditLimit = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { customerId } = req.params;

    const creditLimit = await invoicingService.getCustomerCreditLimit(businessId, customerId);

    return ApiResponse.success(res, creditLimit, 'Customer credit limit retrieved');
  });

  /**
   * Update customer credit limit
   * @route PATCH /api/v1/finance/invoices/customer/:customerId/credit-limit
   */
  updateCustomerCreditLimit = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { customerId } = req.params;
    const { creditLimit } = req.body;

    const updated = await invoicingService.updateCustomerCreditLimit({
      businessId,
      customerId,
      creditLimit
    });

    return ApiResponse.success(res, updated, 'Customer credit limit updated');
  });

  /**
   * Check customer credit status
   * @route GET /api/v1/finance/invoices/customer/:customerId/credit-status
   */
  checkCustomerCreditStatus = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { customerId } = req.params;
    const { amount } = req.query;

    const status = await invoicingService.checkCustomerCreditStatus({
      businessId,
      customerId,
      amount: parseFloat(amount)
    });

    return ApiResponse.success(res, status, 'Customer credit status retrieved');
  });

  /**
   * Get invoice templates
   * @route GET /api/v1/finance/invoices/templates
   */
  getInvoiceTemplates = asyncHandler(async (req, res) => {
    const templates = await invoicingService.getInvoiceTemplates();

    return ApiResponse.success(res, templates, 'Invoice templates retrieved');
  });

  /**
   * Update invoice template
   * @route PATCH /api/v1/finance/invoices/templates/:templateId
   */
  updateInvoiceTemplate = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { templateId } = req.params;
    const templateData = req.body;

    const template = await invoicingService.updateInvoiceTemplate({
      businessId,
      templateId,
      ...templateData
    });

    return ApiResponse.success(res, template, 'Invoice template updated');
  });

  /**
   * Get invoice payment methods
   * @route GET /api/v1/finance/invoices/payment-methods
   */
  getPaymentMethods = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const methods = await invoicingService.getPaymentMethods(businessId);

    return ApiResponse.success(res, methods, 'Payment methods retrieved');
  });

  /**
   * Add payment method
   * @route POST /api/v1/finance/invoices/payment-methods
   */
  addPaymentMethod = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const methodData = req.body;

    const method = await invoicingService.addPaymentMethod(businessId, methodData);

    return ApiResponse.created(res, method, 'Payment method added');
  });

  /**
   * Get invoice settings
   * @route GET /api/v1/finance/invoices/settings
   */
  getInvoiceSettings = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const settings = await invoicingService.getInvoiceSettings(businessId);

    return ApiResponse.success(res, settings, 'Invoice settings retrieved');
  });

  /**
   * Update invoice settings
   * @route PATCH /api/v1/finance/invoices/settings
   */
  updateInvoiceSettings = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const settingsData = req.body;

    const settings = await invoicingService.updateInvoiceSettings(businessId, settingsData);

    return ApiResponse.success(res, settings, 'Invoice settings updated');
  });

  /**
   * Get invoice items
   * @route GET /api/v1/finance/invoices/items
   */
  getInvoiceItems = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const items = await invoicingService.getInvoiceItems(businessId);

    return ApiResponse.success(res, items, 'Invoice items retrieved');
  });

  /**
   * Add invoice item
   * @route POST /api/v1/finance/invoices/items
   */
  addInvoiceItem = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const itemData = req.body;

    const item = await invoicingService.addInvoiceItem(businessId, itemData);

    return ApiResponse.created(res, item, 'Invoice item added');
  });

  /**
   * Update invoice item
   * @route PATCH /api/v1/finance/invoices/items/:itemId
   */
  updateInvoiceItem = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { itemId } = req.params;
    const updateData = req.body;

    const item = await invoicingService.updateInvoiceItem(businessId, itemId, updateData);

    return ApiResponse.success(res, item, 'Invoice item updated');
  });

  /**
   * Delete invoice item
   * @route DELETE /api/v1/finance/invoices/items/:itemId
   */
  deleteInvoiceItem = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { itemId } = req.params;

    await invoicingService.deleteInvoiceItem(businessId, itemId);

    return ApiResponse.success(res, null, 'Invoice item deleted');
  });

  /**
   * Get invoice tax summary
   * @route GET /api/v1/finance/invoices/tax-summary
   */
  getInvoiceTaxSummary = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const summary = await invoicingService.getInvoiceTaxSummary({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, summary, 'Invoice tax summary retrieved');
  });

  /**
   * Get invoice payment forecast
   * @route GET /api/v1/finance/invoices/payment-forecast
   */
  getPaymentForecast = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { months = 3 } = req.query;

    const forecast = await invoicingService.getPaymentForecast(businessId, parseInt(months));

    return ApiResponse.success(res, forecast, 'Payment forecast retrieved');
  });
}

module.exports = new InvoicingController();