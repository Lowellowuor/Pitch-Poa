const expenseService = require('../services/expense.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class ExpensesController {
  /**
   * Create expense
   * @route POST /api/v1/finance/expenses
   */
  createExpense = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const expenseData = req.body;
    const attachments = req.files;

    const expense = await expenseService.createExpense({
      businessId,
      ...expenseData,
      attachments
    });

    return ApiResponse.created(res, expense, 'Expense created');
  });

  /**
   * Get expenses
   * @route GET /api/v1/finance/expenses
   */
  getExpenses = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { category, status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const expenses = await expenseService.getExpenses(businessId, {
      category,
      status,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    return ApiResponse.success(res, expenses, 'Expenses retrieved');
  });

  /**
   * Get expense by ID
   * @route GET /api/v1/finance/expenses/:expenseId
   */
  getExpenseById = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { expenseId } = req.params;

    const expense = await expenseService.getExpenseById(businessId, expenseId);

    return ApiResponse.success(res, expense, 'Expense retrieved');
  });

  /**
   * Update expense
   * @route PATCH /api/v1/finance/expenses/:expenseId
   */
  updateExpense = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { expenseId } = req.params;
    const updateData = req.body;

    const expense = await expenseService.updateExpense(businessId, expenseId, updateData);

    return ApiResponse.success(res, expense, 'Expense updated');
  });

  /**
   * Delete expense
   * @route DELETE /api/v1/finance/expenses/:expenseId
   */
  deleteExpense = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { expenseId } = req.params;

    await expenseService.deleteExpense(businessId, expenseId);

    return ApiResponse.success(res, null, 'Expense deleted');
  });

  /**
   * Upload expense receipt
   * @route POST /api/v1/finance/expenses/:expenseId/receipt
   */
  uploadReceipt = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { expenseId } = req.params;
    const receipt = req.file;

    const expense = await expenseService.uploadReceipt({
      businessId,
      expenseId,
      receipt
    });

    return ApiResponse.success(res, expense, 'Receipt uploaded');
  });

  /**
   * Get expense receipt
   * @route GET /api/v1/finance/expenses/:expenseId/receipt
   */
  getReceipt = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { expenseId } = req.params;

    const receipt = await expenseService.getReceipt(businessId, expenseId);

    res.setHeader('Content-Type', receipt.mimeType);
    res.setHeader('Content-Disposition', `inline; filename=${receipt.filename}`);
    res.send(receipt.data);
  });

  /**
   * Categorize expense
   * @route POST /api/v1/finance/expenses/:expenseId/categorize
   */
  categorizeExpense = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { expenseId } = req.params;
    const { category, subCategory } = req.body;

    const expense = await expenseService.categorizeExpense({
      businessId,
      expenseId,
      category,
      subCategory
    });

    return ApiResponse.success(res, expense, 'Expense categorized');
  });

  /**
   * Get expense categories
   * @route GET /api/v1/finance/expenses/categories
   */
  getExpenseCategories = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const categories = await expenseService.getExpenseCategories(businessId);

    return ApiResponse.success(res, categories, 'Expense categories retrieved');
  });

  /**
   * Create expense category
   * @route POST /api/v1/finance/expenses/categories
   */
  createExpenseCategory = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const categoryData = req.body;

    const category = await expenseService.createExpenseCategory(businessId, categoryData);

    return ApiResponse.created(res, category, 'Expense category created');
  });

  /**
   * Update expense category
   * @route PATCH /api/v1/finance/expenses/categories/:categoryId
   */
  updateExpenseCategory = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { categoryId } = req.params;
    const updateData = req.body;

    const category = await expenseService.updateExpenseCategory(businessId, categoryId, updateData);

    return ApiResponse.success(res, category, 'Expense category updated');
  });

  /**
   * Delete expense category
   * @route DELETE /api/v1/finance/expenses/categories/:categoryId
   */
  deleteExpenseCategory = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { categoryId } = req.params;

    await expenseService.deleteExpenseCategory(businessId, categoryId);

    return ApiResponse.success(res, null, 'Expense category deleted');
  });

  /**
   * Get expense summary by category
   * @route GET /api/v1/finance/expenses/summary-by-category
   */
  getSummaryByCategory = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const summary = await expenseService.getSummaryByCategory({
      businessId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, summary, 'Expense summary by category retrieved');
  });

  /**
   * Get expense trends
   * @route GET /api/v1/finance/expenses/trends
   */
  getExpenseTrends = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { months = 12 } = req.query;

    const trends = await expenseService.getExpenseTrends(businessId, parseInt(months));

    return ApiResponse.success(res, trends, 'Expense trends retrieved');
  });

  /**
   * Get recurring expenses
   * @route GET /api/v1/finance/expenses/recurring
   */
  getRecurringExpenses = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const expenses = await expenseService.getRecurringExpenses(businessId);

    return ApiResponse.success(res, expenses, 'Recurring expenses retrieved');
  });

  /**
   * Create recurring expense
   * @route POST /api/v1/finance/expenses/recurring
   */
  createRecurringExpense = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const expenseData = req.body;

    const expense = await expenseService.createRecurringExpense(businessId, expenseData);

    return ApiResponse.created(res, expense, 'Recurring expense created');
  });

  /**
   * Update recurring expense
   * @route PATCH /api/v1/finance/expenses/recurring/:expenseId
   */
  updateRecurringExpense = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { expenseId } = req.params;
    const updateData = req.body;

    const expense = await expenseService.updateRecurringExpense(businessId, expenseId, updateData);

    return ApiResponse.success(res, expense, 'Recurring expense updated');
  });

  /**
   * Delete recurring expense
   * @route DELETE /api/v1/finance/expenses/recurring/:expenseId
   */
  deleteRecurringExpense = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { expenseId } = req.params;

    await expenseService.deleteRecurringExpense(businessId, expenseId);

    return ApiResponse.success(res, null, 'Recurring expense deleted');
  });

  /**
   * Get expense claims
   * @route GET /api/v1/finance/expenses/claims
   */
  getExpenseClaims = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { status, employeeId } = req.query;

    const claims = await expenseService.getExpenseClaims(businessId, { status, employeeId });

    return ApiResponse.success(res, claims, 'Expense claims retrieved');
  });

  /**
   * Create expense claim
   * @route POST /api/v1/finance/expenses/claims
   */
  createExpenseClaim = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const claimData = req.body;
    const attachments = req.files;

    const claim = await expenseService.createExpenseClaim({
      businessId,
      employeeId: req.user.id,
      ...claimData,
      attachments
    });

    return ApiResponse.created(res, claim, 'Expense claim created');
  });

  /**
   * Approve expense claim
   * @route POST /api/v1/finance/expenses/claims/:claimId/approve
   */
  approveExpenseClaim = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { claimId } = req.params;
    const { notes } = req.body;

    const claim = await expenseService.approveExpenseClaim({
      businessId,
      claimId,
      approvedBy: req.user.id,
      notes
    });

    return ApiResponse.success(res, claim, 'Expense claim approved');
  });

  /**
   * Reject expense claim
   * @route POST /api/v1/finance/expenses/claims/:claimId/reject
   */
  rejectExpenseClaim = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { claimId } = req.params;
    const { reason } = req.body;

    const claim = await expenseService.rejectExpenseClaim({
      businessId,
      claimId,
      rejectedBy: req.user.id,
      reason
    });

    return ApiResponse.success(res, claim, 'Expense claim rejected');
  });

  /**
   * Pay expense claim
   * @route POST /api/v1/finance/expenses/claims/:claimId/pay
   */
  payExpenseClaim = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { claimId } = req.params;
    const { paymentMethod, paymentReference } = req.body;

    const claim = await expenseService.payExpenseClaim({
      businessId,
      claimId,
      paymentMethod,
      paymentReference,
      paidBy: req.user.id
    });

    return ApiResponse.success(res, claim, 'Expense claim paid');
  });

  /**
   * Get expense budget
   * @route GET /api/v1/finance/expenses/budget
   */
  getExpenseBudget = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { year, month } = req.query;

    const budget = await expenseService.getExpenseBudget(businessId, { year, month });

    return ApiResponse.success(res, budget, 'Expense budget retrieved');
  });

  /**
   * Set expense budget
   * @route POST /api/v1/finance/expenses/budget
   */
  setExpenseBudget = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const budgetData = req.body;

    const budget = await expenseService.setExpenseBudget(businessId, budgetData);

    return ApiResponse.created(res, budget, 'Expense budget set');
  });

  /**
   * Get budget vs actual
   * @route GET /api/v1/finance/expenses/budget-vs-actual
   */
  getBudgetVsActual = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { year, month } = req.query;

    const comparison = await expenseService.getBudgetVsActual(businessId, { year, month });

    return ApiResponse.success(res, comparison, 'Budget vs actual retrieved');
  });

  /**
   * Get expense alerts
   * @route GET /api/v1/finance/expenses/alerts
   */
  getExpenseAlerts = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const alerts = await expenseService.getExpenseAlerts(businessId);

    return ApiResponse.success(res, alerts, 'Expense alerts retrieved');
  });

  /**
   * Export expenses
   * @route GET /api/v1/finance/expenses/export
   */
  exportExpenses = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { format, startDate, endDate } = req.query;

    const export_ = await expenseService.exportExpenses({
      businessId,
      format,
      startDate,
      endDate
    });

    res.setHeader('Content-Type', export_.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=expenses.${format}`);
    res.send(export_.data);
  });

  /**
   * Get expense by vendor
   * @route GET /api/v1/finance/expenses/by-vendor/:vendorId
   */
  getExpensesByVendor = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { vendorId } = req.params;
    const { startDate, endDate } = req.query;

    const expenses = await expenseService.getExpensesByVendor({
      businessId,
      vendorId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, expenses, 'Expenses by vendor retrieved');
  });

  /**
   * Get expense by project
   * @route GET /api/v1/finance/expenses/by-project/:projectId
   */
  getExpensesByProject = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const expenses = await expenseService.getExpensesByProject({
      businessId,
      projectId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, expenses, 'Expenses by project retrieved');
  });

  /**
   * Get expense by department
   * @route GET /api/v1/finance/expenses/by-department/:departmentId
   */
  getExpensesByDepartment = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { departmentId } = req.params;
    const { startDate, endDate } = req.query;

    const expenses = await expenseService.getExpensesByDepartment({
      businessId,
      departmentId,
      startDate,
      endDate
    });

    return ApiResponse.success(res, expenses, 'Expenses by department retrieved');
  });

  /**
   * Get expense analytics
   * @route GET /api/v1/finance/expenses/analytics
   */
  getExpenseAnalytics = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period = 'month' } = req.query;

    const analytics = await expenseService.getExpenseAnalytics(businessId, period);

    return ApiResponse.success(res, analytics, 'Expense analytics retrieved');
  });

  /**
   * Get expense forecast
   * @route GET /api/v1/finance/expenses/forecast
   */
  getExpenseForecast = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { months = 3 } = req.query;

    const forecast = await expenseService.getExpenseForecast(businessId, parseInt(months));

    return ApiResponse.success(res, forecast, 'Expense forecast retrieved');
  });

  /**
   * Get top expenses
   * @route GET /api/v1/finance/expenses/top
   */
  getTopExpenses = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { limit = 10 } = req.query;

    const expenses = await expenseService.getTopExpenses(businessId, parseInt(limit));

    return ApiResponse.success(res, expenses, 'Top expenses retrieved');
  });

  /**
   * Get expense audit trail
   * @route GET /api/v1/finance/expenses/:expenseId/audit
   */
  getExpenseAuditTrail = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { expenseId } = req.params;

    const audit = await expenseService.getExpenseAuditTrail(businessId, expenseId);

    return ApiResponse.success(res, audit, 'Expense audit trail retrieved');
  });

  /**
   * Duplicate expense
   * @route POST /api/v1/finance/expenses/:expenseId/duplicate
   */
  duplicateExpense = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { expenseId } = req.params;

    const expense = await expenseService.duplicateExpense(businessId, expenseId);

    return ApiResponse.created(res, expense, 'Expense duplicated');
  });

  /**
   * Split expense
   * @route POST /api/v1/finance/expenses/:expenseId/split
   */
  splitExpense = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { expenseId } = req.params;
    const { splits } = req.body;

    const result = await expenseService.splitExpense({
      businessId,
      expenseId,
      splits
    });

    return ApiResponse.success(res, result, 'Expense split successfully');
  });

  /**
   * Get expense policies
   * @route GET /api/v1/finance/expenses/policies
   */
  getExpensePolicies = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;

    const policies = await expenseService.getExpensePolicies(businessId);

    return ApiResponse.success(res, policies, 'Expense policies retrieved');
  });

  /**
   * Create expense policy
   * @route POST /api/v1/finance/expenses/policies
   */
  createExpensePolicy = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const policyData = req.body;

    const policy = await expenseService.createExpensePolicy(businessId, policyData);

    return ApiResponse.created(res, policy, 'Expense policy created');
  });

  /**
   * Update expense policy
   * @route PATCH /api/v1/finance/expenses/policies/:policyId
   */
  updateExpensePolicy = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { policyId } = req.params;
    const updateData = req.body;

    const policy = await expenseService.updateExpensePolicy(businessId, policyId, updateData);

    return ApiResponse.success(res, policy, 'Expense policy updated');
  });

  /**
   * Delete expense policy
   * @route DELETE /api/v1/finance/expenses/policies/:policyId
   */
  deleteExpensePolicy = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { policyId } = req.params;

    await expenseService.deleteExpensePolicy(businessId, policyId);

    return ApiResponse.success(res, null, 'Expense policy deleted');
  });

  /**
   * Check expense policy compliance
   * @route POST /api/v1/finance/expenses/check-compliance
   */
  checkPolicyCompliance = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { expenseId } = req.body;

    const compliance = await expenseService.checkPolicyCompliance(businessId, expenseId);

    return ApiResponse.success(res, compliance, 'Policy compliance checked');
  });
}

module.exports = new ExpensesController();