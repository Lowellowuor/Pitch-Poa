const payrollService = require('../services/payroll.service');
const kraApiService = require('../services/external-apis/kra-api.service');
const transactionService = require('../services/transaction.service');
const ApiResponse = require('../../../shared/utils/apiResponse');
const asyncHandler = require('../../../shared/utils/asyncHandler');

class PayrollController {
  /**
   * Add employee
   * @route POST /api/v1/finance/payroll/employees
   */
  addEmployee = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const employeeData = req.body;

    // Validate KRA PIN
    const pinStatus = await kraApiService.getPINStatus(employeeData.kraPin);
    if (!pinStatus.valid) {
      return ApiResponse.error(res, {
        message: 'Invalid KRA PIN',
        details: pinStatus,
        statusCode: 400
      });
    }

    const employee = await payrollService.addEmployee(businessId, employeeData);

    return ApiResponse.created(res, employee, 'Employee added');
  });

  /**
   * Get employees
   * @route GET /api/v1/finance/payroll/employees
   */
  getEmployees = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { active, department } = req.query;

    const employees = await payrollService.getEmployees(businessId, {
      active: active === 'true',
      department
    });

    return ApiResponse.success(res, employees, 'Employees retrieved');
  });

  /**
   * Update employee
   * @route PATCH /api/v1/finance/payroll/employees/:employeeId
   */
  updateEmployee = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { employeeId } = req.params;
    const updateData = req.body;

    const employee = await payrollService.updateEmployee(businessId, employeeId, updateData);

    return ApiResponse.success(res, employee, 'Employee updated');
  });

  /**
   * Process payroll
   * @route POST /api/v1/finance/payroll/process
   */
  processPayroll = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period, employees, adjustments } = req.body;

    const payroll = await payrollService.processPayroll({
      businessId,
      period,
      employees,
      adjustments
    });

    return ApiResponse.success(res, payroll, 'Payroll processed');
  });

  /**
   * Get payroll runs
   * @route GET /api/v1/finance/payroll/runs
   */
  getPayrollRuns = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { startDate, endDate } = req.query;

    const runs = await payrollService.getPayrollRuns(businessId, { startDate, endDate });

    return ApiResponse.success(res, runs, 'Payroll runs retrieved');
  });

  /**
   * Get payroll run by ID
   * @route GET /api/v1/finance/payroll/runs/:runId
   */
  getPayrollRun = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { runId } = req.params;

    const run = await payrollService.getPayrollRun(businessId, runId);

    return ApiResponse.success(res, run, 'Payroll run retrieved');
  });

  /**
   * Generate payslip
   * @route GET /api/v1/finance/payroll/payslip/:employeeId/:period
   */
  generatePayslip = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { employeeId, period } = req.params;

    const payslip = await payrollService.generatePayslip(businessId, employeeId, period);

    return ApiResponse.success(res, payslip, 'Payslip generated');
  });

  /**
   * Calculate PAYE
   * @route POST /api/v1/finance/payroll/calculate-paye
   */
  calculatePAYE = asyncHandler(async (req, res) => {
    const { grossPay, personalRelief = 2400, insuranceRelief = 0 } = req.body;

    const paye = await payrollService.calculatePAYE({
      grossPay,
      personalRelief,
      insuranceRelief
    });

    return ApiResponse.success(res, paye, 'PAYE calculated');
  });

  /**
   * Calculate NHIF
   * @route POST /api/v1/finance/payroll/calculate-nhif
   */
  calculateNHIF = asyncHandler(async (req, res) => {
    const { grossPay } = req.body;

    const nhif = await payrollService.calculateNHIF(grossPay);

    return ApiResponse.success(res, nhif, 'NHIF calculated');
  });

  /**
   * Calculate NSSF
   * @route POST /api/v1/finance/payroll/calculate-nssf
   */
  calculateNSSF = asyncHandler(async (req, res) => {
    const { grossPay } = req.body;

    const nssf = await payrollService.calculateNSSF(grossPay);

    return ApiResponse.success(res, nssf, 'NSSF calculated');
  });

  /**
   * File PAYE returns
   * @route POST /api/v1/finance/payroll/file-paye
   */
  filePAYEReturns = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period, employees } = req.body;

    const filing = await payrollService.filePAYEReturns({
      businessId,
      period,
      employees
    });

    return ApiResponse.success(res, filing, 'PAYE returns filed');
  });

  /**
   * Submit NHIF returns
   * @route POST /api/v1/finance/payroll/submit-nhif
   */
  submitNHIFReturns = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period, employees } = req.body;

    const submission = await payrollService.submitNHIFReturns({
      businessId,
      period,
      employees
    });

    return ApiResponse.success(res, submission, 'NHIF returns submitted');
  });

  /**
   * Submit NSSF returns
   * @route POST /api/v1/finance/payroll/submit-nssf
   */
  submitNSSFReturns = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period, employees } = req.body;

    const submission = await payrollService.submitNSSFReturns({
      businessId,
      period,
      employees
    });

    return ApiResponse.success(res, submission, 'NSSF returns submitted');
  });

  /**
   * Process salary payments
   * @route POST /api/v1/finance/payroll/process-payments
   */
  processSalaryPayments = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { runId, paymentMethod } = req.body;

    const payments = await payrollService.processSalaryPayments({
      businessId,
      runId,
      paymentMethod
    });

    return ApiResponse.success(res, payments, 'Salary payments processed');
  });

  /**
   * Get payroll summary
   * @route GET /api/v1/finance/payroll/summary
   */
  getPayrollSummary = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const summary = await payrollService.getPayrollSummary(businessId, period);

    return ApiResponse.success(res, summary, 'Payroll summary retrieved');
  });

  /**
   * Export payroll reports
   * @route GET /api/v1/finance/payroll/export
   */
  exportPayrollReports = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { format, period } = req.query;

    const export_ = await payrollService.exportReports({
      businessId,
      format,
      period
    });

    return ApiResponse.success(res, export_, 'Payroll reports exported');
  });

  /**
   * Get employee by ID
   * @route GET /api/v1/finance/payroll/employees/:employeeId
   */
  getEmployeeById = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { employeeId } = req.params;

    const employee = await payrollService.getEmployeeById(businessId, employeeId);

    return ApiResponse.success(res, employee, 'Employee retrieved');
  });

  /**
   * Delete employee
   * @route DELETE /api/v1/finance/payroll/employees/:employeeId
   */
  deleteEmployee = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { employeeId } = req.params;

    await payrollService.deleteEmployee(businessId, employeeId);

    return ApiResponse.success(res, null, 'Employee deleted');
  });

  /**
   * Get employee payment history
   * @route GET /api/v1/finance/payroll/employees/:employeeId/payments
   */
  getEmployeePaymentHistory = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { employeeId } = req.params;
    const { limit = 12 } = req.query;

    const history = await payrollService.getEmployeePaymentHistory({
      businessId,
      employeeId,
      limit: parseInt(limit)
    });

    return ApiResponse.success(res, history, 'Employee payment history retrieved');
  });

  /**
   * Get employee benefits
   * @route GET /api/v1/finance/payroll/employees/:employeeId/benefits
   */
  getEmployeeBenefits = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { employeeId } = req.params;

    const benefits = await payrollService.getEmployeeBenefits(businessId, employeeId);

    return ApiResponse.success(res, benefits, 'Employee benefits retrieved');
  });

  /**
   * Update employee benefits
   * @route PATCH /api/v1/finance/payroll/employees/:employeeId/benefits
   */
  updateEmployeeBenefits = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { employeeId } = req.params;
    const benefits = req.body;

    const updated = await payrollService.updateEmployeeBenefits({
      businessId,
      employeeId,
      benefits
    });

    return ApiResponse.success(res, updated, 'Employee benefits updated');
  });

  /**
   * Get employee leave balance
   * @route GET /api/v1/finance/payroll/employees/:employeeId/leave-balance
   */
  getEmployeeLeaveBalance = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { employeeId } = req.params;

    const balance = await payrollService.getEmployeeLeaveBalance(businessId, employeeId);

    return ApiResponse.success(res, balance, 'Employee leave balance retrieved');
  });

  /**
   * Process leave pay
   * @route POST /api/v1/finance/payroll/process-leave-pay
   */
  processLeavePay = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { employeeId, days, period } = req.body;

    const leavePay = await payrollService.processLeavePay({
      businessId,
      employeeId,
      days,
      period
    });

    return ApiResponse.success(res, leavePay, 'Leave pay processed');
  });

  /**
   * Process overtime
   * @route POST /api/v1/finance/payroll/process-overtime
   */
  processOvertime = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { employeeId, hours, rate, period } = req.body;

    const overtime = await payrollService.processOvertime({
      businessId,
      employeeId,
      hours,
      rate,
      period
    });

    return ApiResponse.success(res, overtime, 'Overtime processed');
  });

  /**
   * Process bonuses
   * @route POST /api/v1/finance/payroll/process-bonuses
   */
  processBonuses = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { bonuses } = req.body;

    const processed = await payrollService.processBonuses({
      businessId,
      bonuses
    });

    return ApiResponse.success(res, processed, 'Bonuses processed');
  });

  /**
   * Process deductions
   * @route POST /api/v1/finance/payroll/process-deductions
   */
  processDeductions = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { deductions } = req.body;

    const processed = await payrollService.processDeductions({
      businessId,
      deductions
    });

    return ApiResponse.success(res, processed, 'Deductions processed');
  });

  /**
   * Get payroll calendar
   * @route GET /api/v1/finance/payroll/calendar
   */
  getPayrollCalendar = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { year } = req.query;

    const calendar = await payrollService.getPayrollCalendar(businessId, year);

    return ApiResponse.success(res, calendar, 'Payroll calendar retrieved');
  });

  /**
   * Get payroll costs by department
   * @route GET /api/v1/finance/payroll/costs-by-department
   */
  getPayrollCostsByDepartment = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const costs = await payrollService.getPayrollCostsByDepartment(businessId, period);

    return ApiResponse.success(res, costs, 'Payroll costs by department retrieved');
  });

  /**
   * Get payroll trends
   * @route GET /api/v1/finance/payroll/trends
   */
  getPayrollTrends = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { months = 12 } = req.query;

    const trends = await payrollService.getPayrollTrends(businessId, parseInt(months));

    return ApiResponse.success(res, trends, 'Payroll trends retrieved');
  });

  /**
   * Get statutory reports
   * @route GET /api/v1/finance/payroll/statutory-reports
   */
  getStatutoryReports = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period, type } = req.query;

    const reports = await payrollService.getStatutoryReports({
      businessId,
      period,
      type
    });

    return ApiResponse.success(res, reports, 'Statutory reports retrieved');
  });

  /**
   * Get PAYE report
   * @route GET /api/v1/finance/payroll/reports/paye
   */
  getPAYEReport = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const report = await payrollService.getPAYEReport(businessId, period);

    return ApiResponse.success(res, report, 'PAYE report retrieved');
  });

  /**
   * Get NHIF report
   * @route GET /api/v1/finance/payroll/reports/nhif
   */
  getNHIFReport = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const report = await payrollService.getNHIFReport(businessId, period);

    return ApiResponse.success(res, report, 'NHIF report retrieved');
  });

  /**
   * Get NSSF report
   * @route GET /api/v1/finance/payroll/reports/nssf
   */
  getNSSFReport = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const report = await payrollService.getNSSFReport(businessId, period);

    return ApiResponse.success(res, report, 'NSSF report retrieved');
  });

  /**
   * Get housing levy report
   * @route GET /api/v1/finance/payroll/reports/housing-levy
   */
  getHousingLevyReport = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const { period } = req.query;

    const report = await payrollService.getHousingLevyReport(businessId, period);

    return ApiResponse.success(res, report, 'Housing levy report retrieved');
  });

  /**
   * Bulk upload employees
   * @route POST /api/v1/finance/payroll/employees/bulk-upload
   */
  bulkUploadEmployees = asyncHandler(async (req, res) => {
    const businessId = req.user.businessId;
    const file = req.file;

    const results = await payrollService.bulkUploadEmployees(businessId, file);

    return ApiResponse.success(res, results, 'Employees bulk uploaded');
  });

  /**
   * Download employee template
   * @route GET /api/v1/finance/payroll/employees/template
   */
  downloadEmployeeTemplate = asyncHandler(async (req, res) => {
    const { format = 'csv' } = req.query;

    const template = await payrollService.downloadEmployeeTemplate(format);

    res.setHeader('Content-Type', template.contentType);
    res.setHeader('Content-Disposition', `attachment; filename=employee-template.${format}`);
    res.send(template.data);
  });
}

module.exports = new PayrollController();