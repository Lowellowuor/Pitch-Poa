const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

class ExcelGeneratorService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../../../reports');
    
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate Excel report
   */
  async generate(data, type) {
    const filename = `report-${type}-${Date.now()}.xlsx`;
    const filepath = path.join(this.reportsDir, filename);
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AI Sales Platform';
    workbook.lastModifiedBy = 'System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add worksheets based on report type
    switch (type) {
      case 'sales':
        await this.addSalesWorksheet(workbook, data);
        break;
      case 'financial':
        await this.addFinancialWorksheet(workbook, data);
        break;
      case 'customers':
        await this.addCustomerWorksheet(workbook, data);
        break;
      case 'products':
        await this.addProductWorksheet(workbook, data);
        break;
      default:
        await this.addSalesWorksheet(workbook, data);
        await this.addFinancialWorksheet(workbook, data);
        await this.addCustomerWorksheet(workbook, data);
        await this.addProductWorksheet(workbook, data);
    }

    // Add summary worksheet
    await this.addSummaryWorksheet(workbook, data, type);

    // Save workbook
    await workbook.xlsx.writeFile(filepath);

    return {
      filename,
      path: filepath,
      url: `/reports/${filename}`
    };
  }

  /**
   * Add sales worksheet
   */
  async addSalesWorksheet(workbook, data) {
    const worksheet = workbook.addWorksheet('Sales');

    // Add title
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'Sales Report';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Summary section
    worksheet.addRow([]);
    worksheet.addRow(['Summary']);
    worksheet.getCell('A2').font = { bold: true };
    
    worksheet.addRow(['Total Sales', `KES ${data.summary?.total?.toLocaleString() || 0}`]);
    worksheet.addRow(['Transactions', data.summary?.count || 0]);
    worksheet.addRow(['Average Transaction', `KES ${data.summary?.average?.toLocaleString() || 0}`]);
    
    worksheet.addRow([]);
    
    // Daily breakdown
    worksheet.addRow(['Daily Sales Breakdown']);
    worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true };
    
    const headerRow = worksheet.addRow(['Date', 'Sales (KES)', 'Transactions', 'Average']);
    headerRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });

    if (data.trends?.daily) {
      data.trends.daily.forEach(day => {
        worksheet.addRow([
          day.date,
          day.total || 0,
          day.count || 0,
          day.count > 0 ? day.total / day.count : 0
        ]);
      });
    }

    // Format numbers
    worksheet.getColumn(2).numFmt = '#,##0';
    worksheet.getColumn(4).numFmt = '#,##0';
  }

  /**
   * Add financial worksheet
   */
  async addFinancialWorksheet(workbook, data) {
    const worksheet = workbook.addWorksheet('Financial');

    // P&L Section
    worksheet.addRow(['Profit & Loss Statement']);
    worksheet.getCell('A1').font = { size: 16, bold: true };
    
    worksheet.addRow([]);
    worksheet.addRow(['Revenue', `KES ${data.profit?.revenue?.toLocaleString() || 0}`]);
    worksheet.addRow(['Cost of Goods', `KES ${data.profit?.cost?.toLocaleString() || 0}`]);
    worksheet.addRow(['Gross Profit', `KES ${data.profit?.profit?.toLocaleString() || 0}`]);
    worksheet.addRow(['Margin', `${data.profit?.margin || 0}%`]);
    
    worksheet.addRow([]);
    
    // Expenses
    worksheet.addRow(['Expenses by Category']);
    worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true };
    
    const expenseHeader = worksheet.addRow(['Category', 'Amount (KES)', 'Percentage']);
    expenseHeader.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });

    if (data.expenses) {
      data.expenses.forEach(exp => {
        worksheet.addRow([exp.category, exp.total || 0, `${exp.percentage || 0}%`]);
      });
    }
  }

  /**
   * Add customer worksheet
   */
  async addCustomerWorksheet(workbook, data) {
    const worksheet = workbook.addWorksheet('Customers');

    // Customer Metrics
    worksheet.addRow(['Customer Analytics']);
    worksheet.getCell('A1').font = { size: 16, bold: true };
    
    worksheet.addRow([]);
    worksheet.addRow(['Total Customers', data.segments?.total || 0]);
    worksheet.addRow(['VIP Customers', data.segments?.vip?.length || 0]);
    worksheet.addRow(['Regular Customers', data.segments?.regular?.length || 0]);
    worksheet.addRow(['New Customers', data.segments?.new?.length || 0]);
    worksheet.addRow(['At Risk Customers', data.segments?.atRisk?.length || 0]);
    
    worksheet.addRow([]);
    
    // Customer List
    worksheet.addRow(['Top Customers']);
    worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true };
    
    const customerHeader = worksheet.addRow(['Customer Name', 'Total Spent', 'Transactions', 'Last Purchase']);
    customerHeader.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });

    if (data.topCustomers) {
      data.topCustomers.forEach(customer => {
        worksheet.addRow([
          customer.name,
          customer.totalSpent || 0,
          customer.transactions || 0,
          customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'N/A'
        ]);
      });
    }
  }

  /**
   * Add product worksheet
   */
  async addProductWorksheet(workbook, data) {
    const worksheet = workbook.addWorksheet('Products');

    // Product Performance
    worksheet.addRow(['Product Analytics']);
    worksheet.getCell('A1').font = { size: 16, bold: true };
    
    worksheet.addRow([]);
    worksheet.addRow(['Inventory Summary']);
    worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true };
    
    worksheet.addRow(['Total Products', data.inventory?.total || 0]);
    worksheet.addRow(['Low Stock Items', data.inventory?.lowStock?.length || 0]);
    worksheet.addRow(['Out of Stock', data.inventory?.outOfStock?.length || 0]);
    
    worksheet.addRow([]);
    
    // Product List
    worksheet.addRow(['Product Performance']);
    worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true };
    
    const productHeader = worksheet.addRow([
      'Product Name',
      'Units Sold',
      'Revenue (KES)',
      'Stock Level',
      'Status'
    ]);
    
    productHeader.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });

    if (data.products) {
      data.products.forEach(product => {
        const status = product.stockLevel <= 0 ? 'Out of Stock' :
                      product.stockLevel < 10 ? 'Low Stock' : 'In Stock';
        
        worksheet.addRow([
          product.name,
          product.quantity || 0,
          product.revenue || 0,
          product.stockLevel || 0,
          status
        ]);
      });
    }
  }

  /**
   * Add summary worksheet
   */
  async addSummaryWorksheet(workbook, data, type) {
    const worksheet = workbook.addWorksheet('Summary');

    worksheet.addRow(['Executive Summary']);
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.mergeCells('A1:C1');

    worksheet.addRow([]);
    worksheet.addRow(['Report Type', type.toUpperCase()]);
    worksheet.addRow(['Generated On', new Date().toLocaleString()]);
    worksheet.addRow(['Period', data.period || 'N/A']);

    worksheet.addRow([]);
    worksheet.addRow(['Key Metrics']);
    worksheet.getCell(`A${worksheet.lastRow.number}`).font = { bold: true };

    worksheet.addRow(['Total Sales', `KES ${data.summary?.total?.toLocaleString() || 0}`]);
    worksheet.addRow(['Total Profit', `KES ${data.profit?.profit?.toLocaleString() || 0}`]);
    worksheet.addRow(['Profit Margin', `${data.profit?.margin || 0}%`]);
    worksheet.addRow(['Total Customers', data.segments?.total || 0]);
    worksheet.addRow(['Total Transactions', data.summary?.count || 0]);

    // Format
    worksheet.getColumn(2).numFmt = '#,##0';
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
  }
}

module.exports = new ExcelGeneratorService();