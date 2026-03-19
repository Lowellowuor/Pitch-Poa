const accountingService = require('../services/accounting.service');
const transactionService = require('../services/transaction.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class AccountingController {
  /**
   * Create chart of accounts
   * @route POST /api/v1/finance/accounting/chart-of-accounts
   */
  createChartOfAccounts = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const accounts = req.body;

    const chart = await accountingService.createChartOfAccounts(businessId, accounts);

    return ApiResponse.created(res, chart, 'Chart of accounts created');
  });

  /**
   * Get chart of accounts
   * @route GET /api/v1/finance/accounting/chart-of-accounts
   */
  getChartOfAccounts = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const chart = await accountingService.getChartOfAccounts(businessId);

    return ApiResponse.success(res, chart, 'Chart of accounts retrieved');
  });

  /**
   * Create journal entry
   * @route POST /api/v1/finance/accounting/journal
   */
  createJournalEntry = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { date, description, entries } = req.body;

    const journal = await accountingService.createJournalEntry({
      businessId,
      date,
      description,
      entries
    });

    return ApiResponse.created(res, journal, 'Journal entry created');
  });

  /**
   * Get general ledger
   * @route GET /api/v1/finance/accounting/ledger
   */
  getGeneralLedger = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate, accountCode } = req.query;

    const ledger = await accountingService.getGeneralLedger({
      businessId,
      startDate,
      endDate,
      accountCode
    });

    return ApiResponse.success(res, ledger, 'General ledger retrieved');
  });

  /**
   * Get trial balance
   * @route GET /api/v1/finance/accounting/trial-balance
   */
  getTrialBalance = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { asAt } = req.query;

    const trialBalance = await accountingService.getTrialBalance(businessId, asAt);

    return ApiResponse.success(res, trialBalance, 'Trial balance retrieved');
  });

  /**
   * Get balance sheet
   * @route GET /api/v1/finance/accounting/balance-sheet
   */
  getBalanceSheet = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { asAt } = req.query;

    const balanceSheet = await accountingService.getBalanceSheet(businessId, asAt);

    return ApiResponse.success(res, balanceSheet, 'Balance sheet retrieved');
  });

  /**
   * Get profit & loss statement
   * @route GET /api/v1/finance/accounting/profit-loss
   */
  getProfitLoss = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const profitLoss = await accountingService.getProfitLoss({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, profitLoss, 'Profit & loss retrieved');
  });

  /**
   * Get cash flow statement
   * @route GET /api/v1/finance/accounting/cash-flow
   */
  getCashFlow = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const cashFlow = await accountingService.getCashFlow({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, cashFlow, 'Cash flow statement retrieved');
  });

  /**
   * Reconcile account
   * @route POST /api/v1/finance/accounting/reconcile
   */
  reconcileAccount = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { accountId, statementBalance, transactions } = req.body;

    const reconciliation = await accountingService.reconcileAccount({
      businessId,
      accountId,
      statementBalance,
      transactions
    });

    return ApiResponse.success(res, reconciliation, 'Account reconciled');
  });

  /**
   * Get unreconciled items
   * @route GET /api/v1/finance/accounting/unreconciled
   */
  getUnreconciledItems = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { accountId } = req.query;

    const items = await accountingService.getUnreconciledItems(businessId, accountId);

    return ApiResponse.success(res, items, 'Unreconciled items retrieved');
  });

  /**
   * Create budget
   * @route POST /api/v1/finance/accounting/budgets
   */
  createBudget = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const budgetData = req.body;

    const budget = await accountingService.createBudget(businessId, budgetData);

    return ApiResponse.created(res, budget, 'Budget created');
  });

  /**
   * Get budget vs actual
   * @route GET /api/v1/finance/accounting/budget-vs-actual
   */
  getBudgetVsActual = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { budgetId, startDate, endDate } = req.query;

    const comparison = await accountingService.getBudgetVsActual({
      businessId,
      budgetId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, comparison, 'Budget vs actual retrieved');
  });

  /**
   * Close accounting period
   * @route POST /api/v1/finance/accounting/close-period
   */
  closePeriod = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { periodEnd } = req.body;

    const result = await accountingService.closePeriod(businessId, periodEnd);

    return ApiResponse.success(res, result, 'Accounting period closed');
  });

  /**
   * Get financial ratios
   * @route GET /api/v1/finance/accounting/ratios
   */
  getFinancialRatios = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { asAt } = req.query;

    const ratios = await accountingService.getFinancialRatios(businessId, asAt);

    return ApiResponse.success(res, ratios, 'Financial ratios retrieved');
  });

  /**
   * Export financial statements
   * @route GET /api/v1/finance/accounting/export
   */
  exportStatements = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { type, format, startDate, endDate } = req.query;

    const export_ = await accountingService.exportStatements({
      businessId,
      type,
      format,
      startDate,
      endDate
    });

    return ApiResponse.success(res, export_, 'Statements exported');
  });

  /**
   * Get account balance
   * @route GET /api/v1/finance/accounting/account/:accountId/balance
   */
  getAccountBalance = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { accountId } = req.params;
    const { asAt } = req.query;

    const balance = await accountingService.getAccountBalance(businessId, accountId, asAt);

    return ApiResponse.success(res, balance, 'Account balance retrieved');
  });

  /**
   * Get account transactions
   * @route GET /api/v1/finance/accounting/account/:accountId/transactions
   */
  getAccountTransactions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { accountId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    const transactions = await accountingService.getAccountTransactions({
      businessId,
      accountId,
      startDate,
      endDate,
      limit: parseInt(limit)
    });

    return ApiResponse.success(res, transactions, 'Account transactions retrieved');
  });

  /**
   * Create account
   * @route POST /api/v1/finance/accounting/accounts
   */
  createAccount = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const accountData = req.body;

    const account = await accountingService.createAccount(businessId, accountData);

    return ApiResponse.created(res, account, 'Account created');
  });

  /**
   * Update account
   * @route PATCH /api/v1/finance/accounting/accounts/:accountId
   */
  updateAccount = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { accountId } = req.params;
    const updateData = req.body;

    const account = await accountingService.updateAccount(businessId, accountId, updateData);

    return ApiResponse.success(res, account, 'Account updated');
  });

  /**
   * Delete account
   * @route DELETE /api/v1/finance/accounting/accounts/:accountId
   */
  deleteAccount = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { accountId } = req.params;

    await accountingService.deleteAccount(businessId, accountId);

    return ApiResponse.success(res, null, 'Account deleted');
  });

  /**
   * Get account types
   * @route GET /api/v1/finance/accounting/account-types
   */
  getAccountTypes = asyncHandler(async (req, res) => {
    const types = await accountingService.getAccountTypes();

    return ApiResponse.success(res, types, 'Account types retrieved');
  });

  /**
   * Get account hierarchy
   * @route GET /api/v1/finance/accounting/account-hierarchy
   */
  getAccountHierarchy = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const hierarchy = await accountingService.getAccountHierarchy(businessId);

    return ApiResponse.success(res, hierarchy, 'Account hierarchy retrieved');
  });

  /**
   * Get opening balances
   * @route GET /api/v1/finance/accounting/opening-balances
   */
  getOpeningBalances = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { asAt } = req.query;

    const balances = await accountingService.getOpeningBalances(businessId, asAt);

    return ApiResponse.success(res, balances, 'Opening balances retrieved');
  });

  /**
   * Set opening balances
   * @route POST /api/v1/finance/accounting/opening-balances
   */
  setOpeningBalances = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { balances } = req.body;

    const result = await accountingService.setOpeningBalances(businessId, balances);

    return ApiResponse.success(res, result, 'Opening balances set');
  });

  /**
   * Get journal entries
   * @route GET /api/v1/finance/accounting/journals
   */
  getJournalEntries = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    const journals = await accountingService.getJournalEntries({
      businessId,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    return ApiResponse.success(res, journals, 'Journal entries retrieved');
  });

  /**
   * Get journal entry by ID
   * @route GET /api/v1/finance/accounting/journals/:journalId
   */
  getJournalEntryById = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { journalId } = req.params;

    const journal = await accountingService.getJournalEntryById(businessId, journalId);

    return ApiResponse.success(res, journal, 'Journal entry retrieved');
  });

  /**
   * Reverse journal entry
   * @route POST /api/v1/finance/accounting/journals/:journalId/reverse
   */
  reverseJournalEntry = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { journalId } = req.params;
    const { reason } = req.body;

    const reversed = await accountingService.reverseJournalEntry({
      businessId,
      journalId,
      reason
    });

    return ApiResponse.success(res, reversed, 'Journal entry reversed');
  });

  /**
   * Get budgets
   * @route GET /api/v1/finance/accounting/budgets
   */
  getBudgets = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { year, active } = req.query;

    const budgets = await accountingService.getBudgets(businessId, {
      year: parseInt(year),
      active: active === 'true'
    });

    return ApiResponse.success(res, budgets, 'Budgets retrieved');
  });

  /**
   * Get budget by ID
   * @route GET /api/v1/finance/accounting/budgets/:budgetId
   */
  getBudgetById = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { budgetId } = req.params;

    const budget = await accountingService.getBudgetById(businessId, budgetId);

    return ApiResponse.success(res, budget, 'Budget retrieved');
  });

  /**
   * Update budget
   * @route PATCH /api/v1/finance/accounting/budgets/:budgetId
   */
  updateBudget = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { budgetId } = req.params;
    const updateData = req.body;

    const budget = await accountingService.updateBudget(businessId, budgetId, updateData);

    return ApiResponse.success(res, budget, 'Budget updated');
  });

  /**
   * Delete budget
   * @route DELETE /api/v1/finance/accounting/budgets/:budgetId
   */
  deleteBudget = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { budgetId } = req.params;

    await accountingService.deleteBudget(businessId, budgetId);

    return ApiResponse.success(res, null, 'Budget deleted');
  });
}

module.exports = new AccountingController();