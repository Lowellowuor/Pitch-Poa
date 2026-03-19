const transactionService = require('../services/transaction.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class TransactionsController {
  /**
   * Create a new transaction
   * @route POST /api/v1/finance/transactions
   */
  createTransaction = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const transactionData = req.body;

    const transaction = await transactionService.createTransaction({
      businessId,
      ...transactionData
    });

    return ApiResponse.created(res, transaction, 'Transaction created successfully');
  });

  /**
   * Get all transactions with filtering
   * @route GET /api/v1/finance/transactions
   */
  getTransactions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { 
      type, 
      status, 
      startDate, 
      endDate, 
      accountId,
      reference,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const transactions = await transactionService.getTransactions(businessId, {
      type,
      status,
      startDate,
      endDate,
      accountId,
      reference,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    return ApiResponse.success(res, transactions, 'Transactions retrieved successfully');
  });

  /**
   * Get transaction by ID
   * @route GET /api/v1/finance/transactions/:id
   */
  getTransactionById = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;

    const transaction = await transactionService.getTransactionById(businessId, id);

    if (!transaction) {
      return ApiResponse.notFound(res, 'Transaction not found');
    }

    return ApiResponse.success(res, transaction, 'Transaction retrieved successfully');
  });

  /**
   * Update transaction
   * @route PATCH /api/v1/finance/transactions/:id
   */
  updateTransaction = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const updateData = req.body;

    const transaction = await transactionService.updateTransaction(businessId, id, updateData);

    return ApiResponse.success(res, transaction, 'Transaction updated successfully');
  });

  /**
   * Delete transaction
   * @route DELETE /api/v1/finance/transactions/:id
   */
  deleteTransaction = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;

    await transactionService.deleteTransaction(businessId, id);

    return ApiResponse.success(res, null, 'Transaction deleted successfully');
  });

  /**
   * Get transaction by reference
   * @route GET /api/v1/finance/transactions/reference/:reference
   */
  getTransactionByReference = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { reference } = req.params;

    const transaction = await transactionService.getTransactionByReference(businessId, reference);

    if (!transaction) {
      return ApiResponse.notFound(res, 'Transaction not found');
    }

    return ApiResponse.success(res, transaction, 'Transaction retrieved successfully');
  });

  /**
   * Get transaction statistics
   * @route GET /api/v1/finance/transactions/statistics
   */
  getTransactionStatistics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = 'month', startDate, endDate } = req.query;

    const statistics = await transactionService.getTransactionStatistics({
      businessId,
      period,
      startDate,
      endDate
    });

    return ApiResponse.success(res, statistics, 'Transaction statistics retrieved');
  });

  /**
   * Get daily transaction summary
   * @route GET /api/v1/finance/transactions/daily-summary
   */
  getDailySummary = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { date } = req.query;

    const summary = await transactionService.getDailySummary(businessId, date);

    return ApiResponse.success(res, summary, 'Daily summary retrieved');
  });

  /**
   * Get transaction trends
   * @route GET /api/v1/finance/transactions/trends
   */
  getTransactionTrends = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { months = 6 } = req.query;

    const trends = await transactionService.getTransactionTrends(businessId, parseInt(months));

    return ApiResponse.success(res, trends, 'Transaction trends retrieved');
  });

  /**
   * Get top transactions
   * @route GET /api/v1/finance/transactions/top
   */
  getTopTransactions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { type, limit = 10 } = req.query;

    const top = await transactionService.getTopTransactions({
      businessId,
      type,
      limit: parseInt(limit)
    });

    return ApiResponse.success(res, top, 'Top transactions retrieved');
  });

  /**
   * Bulk create transactions
   * @route POST /api/v1/finance/transactions/bulk
   */
  bulkCreateTransactions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { transactions } = req.body;

    const results = await transactionService.bulkCreateTransactions(businessId, transactions);

    return ApiResponse.success(res, results, 'Bulk transactions created');
  });

  /**
   * Reconcile transactions
   * @route POST /api/v1/finance/transactions/reconcile
   */
  reconcileTransactions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { transactionIds } = req.body;

    const reconciled = await transactionService.reconcileTransactions(businessId, transactionIds);

    return ApiResponse.success(res, reconciled, 'Transactions reconciled');
  });

  /**
   * Get unreconciled transactions
   * @route GET /api/v1/finance/transactions/unreconciled
   */
  getUnreconciledTransactions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const unreconciled = await transactionService.getUnreconciledTransactions(businessId);

    return ApiResponse.success(res, unreconciled, 'Unreconciled transactions retrieved');
  });

  /**
   * Search transactions
   * @route GET /api/v1/finance/transactions/search
   */
  searchTransactions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { q, fields } = req.query;

    const results = await transactionService.searchTransactions({
      businessId,
      query: q,
      fields: fields ? fields.split(',') : ['reference', 'description', 'notes']
    });

    return ApiResponse.success(res, results, 'Search results retrieved');
  });

  /**
   * Export transactions
   * @route GET /api/v1/finance/transactions/export
   */
  exportTransactions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { format = 'csv', startDate, endDate } = req.query;

    const exportData = await transactionService.exportTransactions({
      businessId,
      format,
      startDate,
      endDate
    });

    res.setHeader('Content-Type', exportData.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=transactions.${format}`);
    res.send(exportData.data);
  });

  /**
   * Get transaction categories
   * @route GET /api/v1/finance/transactions/categories
   */
  getTransactionCategories = asyncHandler(async (req, res) => {
    const categories = await transactionService.getTransactionCategories();

    return ApiResponse.success(res, categories, 'Transaction categories retrieved');
  });

  /**
   * Void transaction
   * @route POST /api/v1/finance/transactions/:id/void
   */
  voidTransaction = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { reason } = req.body;

    const voided = await transactionService.voidTransaction(businessId, id, reason);

    return ApiResponse.success(res, voided, 'Transaction voided successfully');
  });

  /**
   * Get transaction by date range
   * @route GET /api/v1/finance/transactions/date-range
   */
  getTransactionsByDateRange = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const transactions = await transactionService.getTransactionsByDateRange({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, transactions, 'Transactions by date range retrieved');
  });

  /**
   * Get transaction summary by type
   * @route GET /api/v1/finance/transactions/summary-by-type
   */
  getSummaryByType = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const summary = await transactionService.getSummaryByType(businessId, period);

    return ApiResponse.success(res, summary, 'Summary by type retrieved');
  });

  /**
   * Flag suspicious transaction
   * @route POST /api/v1/finance/transactions/:id/flag
   */
  flagSuspiciousTransaction = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { reason, riskLevel } = req.body;

    const flagged = await transactionService.flagSuspiciousTransaction({
      businessId,
      transactionId: id,
      reason,
      riskLevel
    });

    return ApiResponse.success(res, flagged, 'Transaction flagged as suspicious');
  });

  /**
   * Get flagged transactions
   * @route GET /api/v1/finance/transactions/flagged
   */
  getFlaggedTransactions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { riskLevel } = req.query;

    const flagged = await transactionService.getFlaggedTransactions(businessId, riskLevel);

    return ApiResponse.success(res, flagged, 'Flagged transactions retrieved');
  });

  /**
   * Approve pending transaction
   * @route POST /api/v1/finance/transactions/:id/approve
   */
  approveTransaction = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { approvalNotes } = req.body;

    const approved = await transactionService.approveTransaction({
      businessId,
      transactionId: id,
      approvedBy: req.user.id,
      approvalNotes
    });

    return ApiResponse.success(res, approved, 'Transaction approved');
  });

  /**
   * Reject pending transaction
   * @route POST /api/v1/finance/transactions/:id/reject
   */
  rejectTransaction = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const rejected = await transactionService.rejectTransaction({
      businessId,
      transactionId: id,
      rejectedBy: req.user.id,
      rejectionReason
    });

    return ApiResponse.success(res, rejected, 'Transaction rejected');
  });

  /**
   * Get transaction timeline
   * @route GET /api/v1/finance/transactions/:id/timeline
   */
  getTransactionTimeline = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;

    const timeline = await transactionService.getTransactionTimeline(businessId, id);

    return ApiResponse.success(res, timeline, 'Transaction timeline retrieved');
  });

  /**
   * Split transaction
   * @route POST /api/v1/finance/transactions/:id/split
   */
  splitTransaction = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { splits } = req.body;

    const result = await transactionService.splitTransaction({
      businessId,
      transactionId: id,
      splits
    });

    return ApiResponse.success(res, result, 'Transaction split successfully');
  });

  /**
   * Merge transactions
   * @route POST /api/v1/finance/transactions/merge
   */
  mergeTransactions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { transactionIds } = req.body;

    const merged = await transactionService.mergeTransactions(businessId, transactionIds);

    return ApiResponse.success(res, merged, 'Transactions merged successfully');
  });
}

module.exports = new TransactionsController();