const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGeneratorService {
  constructor() {
    this.reportsDir = path.join(__dirname, '../../../../reports');
    
    // Create reports directory if it doesn't exist
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate PDF report
   */
  async generate(data, type) {
    const filename = `report-${type}-${Date.now()}.pdf`;
    const filepath = path.join(this.reportsDir, filename);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);
        
        doc.pipe(stream);
        
        // Add header
        this.addHeader(doc, type);
        
        // Add content based on report type
        switch (type) {
          case 'sales':
            this.addSalesReport(doc, data);
            break;
          case 'financial':
            this.addFinancialReport(doc, data);
            break;
          case 'customers':
            this.addCustomerReport(doc, data);
            break;
          case 'products':
            this.addProductReport(doc, data);
            break;
          default:
            this.addFullReport(doc, data);
        }
        
        // Add footer
        this.addFooter(doc);
        
        doc.end();
        
        stream.on('finish', () => {
          resolve({
            filename,
            path: filepath,
            url: `/reports/${filename}`
          });
        });
        
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add header to PDF
   */
  addHeader(doc, type) {
    doc.fontSize(20)
       .text('AI Sales Platform - Analytics Report', { align: 'center' })
       .moveDown();
    
    doc.fontSize(16)
       .text(`${type.toUpperCase()} REPORT`, { align: 'center' })
       .moveDown();
    
    doc.fontSize(10)
       .text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' })
       .moveDown();
    
    doc.moveDown();
  }

  /**
   * Add sales report content
   */
  addSalesReport(doc, data) {
    // Summary
    doc.fontSize(14).text('Sales Summary', { underline: true }).moveDown();
    
    doc.fontSize(12).text(`Total Sales: KES ${data.summary?.total?.toLocaleString() || 0}`);
    doc.text(`Transactions: ${data.summary?.count || 0}`);
    doc.text(`Average Transaction: KES ${data.summary?.average?.toLocaleString() || 0}`);
    doc.moveDown();

    // Trends chart placeholder (in production, generate actual chart)
    doc.fontSize(14).text('Sales Trends', { underline: true }).moveDown();
    
    if (data.trends?.daily) {
      data.trends.daily.slice(0, 10).forEach(day => {
        doc.fontSize(10)
           .text(`${day.date}: KES ${day.total?.toLocaleString() || 0} (${day.count || 0} transactions)`);
      });
    }
    doc.moveDown();

    // Top products
    doc.fontSize(14).text('Top Products', { underline: true }).moveDown();
    
    if (data.products) {
      data.products.slice(0, 5).forEach((product, i) => {
        doc.fontSize(10)
           .text(`${i + 1}. ${product.name}: ${product.quantity} units - KES ${product.revenue?.toLocaleString() || 0}`);
      });
    }
  }

  /**
   * Add financial report content
   */
  addFinancialReport(doc, data) {
    doc.fontSize(14).text('Profit & Loss', { underline: true }).moveDown();
    
    doc.fontSize(12).text(`Revenue: KES ${data.profit?.revenue?.toLocaleString() || 0}`);
    doc.text(`Costs: KES ${data.profit?.cost?.toLocaleString() || 0}`);
    doc.text(`Profit: KES ${data.profit?.profit?.toLocaleString() || 0}`);
    doc.text(`Margin: ${data.profit?.margin || 0}%`);
    doc.moveDown();

    // Expenses by category
    doc.fontSize(14).text('Expenses by Category', { underline: true }).moveDown();
    
    if (data.expenses) {
      data.expenses.forEach(exp => {
        doc.fontSize(10)
           .text(`${exp.category}: KES ${exp.total?.toLocaleString() || 0} (${exp.percentage || 0}%)`);
      });
    }
  }

  /**
   * Add customer report content
   */
  addCustomerReport(doc, data) {
    doc.fontSize(14).text('Customer Metrics', { underline: true }).moveDown();
    
    doc.fontSize(12).text(`Total Customers: ${data.segments?.total || 0}`);
    doc.text(`VIP Customers: ${data.segments?.vip?.length || 0}`);
    doc.text(`Regular Customers: ${data.segments?.regular?.length || 0}`);
    doc.text(`New Customers: ${data.segments?.new?.length || 0}`);
    doc.text(`At Risk: ${data.segments?.atRisk?.length || 0}`);
    doc.moveDown();

    doc.fontSize(12).text(`Customer LTV: KES ${data.ltv?.average?.toLocaleString() || 0}`);
    doc.text(`Acquisition Cost: KES ${data.cac?.average?.toLocaleString() || 0}`);
    doc.text(`Retention Rate: ${data.retention?.rate || 0}%`);
    doc.text(`Churn Rate: ${data.churn?.rate || 0}%`);
  }

  /**
   * Add product report content
   */
  addProductReport(doc, data) {
    doc.fontSize(14).text('Inventory Status', { underline: true }).moveDown();
    
    doc.fontSize(12).text(`Total Products: ${data.inventory?.total || 0}`);
    doc.text(`Low Stock Items: ${data.inventory?.lowStock?.length || 0}`);
    doc.text(`Out of Stock: ${data.inventory?.outOfStock?.length || 0}`);
    doc.moveDown();

    doc.fontSize(14).text('Stock Turnover', { underline: true }).moveDown();
    doc.fontSize(12).text(`Turnover Rate: ${data.turnover?.rate || 0}x`);
    doc.text(`Average Days in Stock: ${data.turnover?.avgDays || 0}`);
  }

  /**
   * Add full comprehensive report
   */
  addFullReport(doc, data) {
    this.addSalesReport(doc, data);
    doc.addPage();
    this.addFinancialReport(doc, data);
    doc.addPage();
    this.addCustomerReport(doc, data);
    doc.addPage();
    this.addProductReport(doc, data);
  }

  /**
   * Add footer to PDF
   */
  addFooter(doc) {
    const pages = doc.bufferedPageRange();
    
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      doc.fontSize(8)
         .text(
           `Page ${i + 1} of ${pages.count}`,
           50,
           doc.page.height - 50,
           { align: 'center' }
         );
    }
  }
}

module.exports = new PDFGeneratorService();