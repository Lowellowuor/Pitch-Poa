const nodemailer = require('nodemailer');
const PDFGenerator = require('./pdf-generator.service');
const ExcelGenerator = require('./excel-generator.service');

class EmailReportsService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Send report via email
   */
  async sendReport(email, data, type, format = 'pdf') {
    try {
      // Generate report
      let report;
      if (format === 'pdf') {
        report = await PDFGenerator.generate(data, type);
      } else {
        report = await ExcelGenerator.generate(data, type);
      }

      // Email content based on report type
      const subject = this.getSubject(type);
      const html = this.getEmailTemplate(type, data);

      // Send email
      const info = await this.transporter.sendMail({
        from: `"AI Sales Platform" <${process.env.SMTP_FROM}>`,
        to: email,
        subject,
        html,
        attachments: [
          {
            filename: report.filename,
            path: report.path
          }
        ]
      });

      return {
        success: true,
        messageId: info.messageId,
        report
      };
    } catch (error) {
      console.error('Email Report Error:', error);
      throw new Error('Failed to send email report');
    }
  }

  /**
   * Schedule recurring reports
   */
  async scheduleReport(userId, email, type, schedule, format = 'pdf') {
    // This would integrate with a job scheduler like Bull or Agenda
    // For now, return schedule configuration
    return {
      scheduled: true,
      userId,
      email,
      type,
      schedule,
      format,
      nextRun: this.calculateNextRun(schedule)
    };
  }

  /**
   * Send automated weekly report
   */
  async sendWeeklyReport(userId, email, businessData) {
    const subject = 'Your Weekly Business Report - AI Sales Platform';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .metric { background: #F3F4F6; margin: 10px 0; padding: 15px; border-radius: 5px; }
          .metric h3 { margin: 0 0 10px 0; color: #4F46E5; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Weekly Business Report</h1>
            <p>${new Date().toLocaleDateString()} - ${new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}</p>
          </div>
          
          <div class="content">
            <h2>Performance Summary</h2>
            
            <div class="metric">
              <h3>💰 Sales</h3>
              <p><strong>Total:</strong> KES ${businessData.sales?.total?.toLocaleString() || 0}</p>
              <p><strong>Transactions:</strong> ${businessData.sales?.count || 0}</p>
              <p><strong>Average:</strong> KES ${businessData.sales?.average?.toLocaleString() || 0}</p>
            </div>
            
            <div class="metric">
              <h3>📈 Profit</h3>
              <p><strong>Revenue:</strong> KES ${businessData.profit?.revenue?.toLocaleString() || 0}</p>
              <p><strong>Profit:</strong> KES ${businessData.profit?.profit?.toLocaleString() || 0}</p>
              <p><strong>Margin:</strong> ${businessData.profit?.margin || 0}%</p>
            </div>
            
            <div class="metric">
              <h3>👥 Customers</h3>
              <p><strong>New Customers:</strong> ${businessData.customers?.new || 0}</p>
              <p><strong>Repeat Rate:</strong> ${businessData.customers?.repeatRate || 0}%</p>
              <p><strong>Total Customers:</strong> ${businessData.customers?.total || 0}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/analytics" class="button">View Full Dashboard</a>
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} AI Sales Platform. All rights reserved.</p>
            <p>This is an automated report. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.transporter.sendMail({
      from: `"AI Sales Platform" <${process.env.SMTP_FROM}>`,
      to: email,
      subject,
      html
    });
  }

  /**
   * Get email subject based on report type
   */
  getSubject(type) {
    const subjects = {
      sales: 'Sales Report - AI Sales Platform',
      financial: 'Financial Report - AI Sales Platform',
      customers: 'Customer Report - AI Sales Platform',
      products: 'Product Report - AI Sales Platform',
      full: 'Complete Business Report - AI Sales Platform'
    };
    return subjects[type] || subjects.full;
  }

  /**
   * Get email template
   */
  getEmailTemplate(type, data) {
    const titles = {
      sales: 'Sales Analytics Report',
      financial: 'Financial Performance Report',
      customers: 'Customer Insights Report',
      products: 'Product Performance Report',
      full: 'Complete Business Analytics Report'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${titles[type]}</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="content">
            <p>Dear Business Owner,</p>
            
            <p>Your requested ${type} report is attached to this email. The report contains detailed analytics and insights about your business performance.</p>
            
            <p><strong>Report Summary:</strong></p>
            <ul>
              <li>Period: ${data.period || 'Selected period'}</li>
              <li>Generated: ${new Date().toLocaleString()}</li>
              <li>Format: PDF/Excel attached</li>
            </ul>
            
            <p>You can also view this report online in your dashboard:</p>
            <p><a href="${process.env.FRONTEND_URL}/analytics" style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a></p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} AI Sales Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Calculate next run time for scheduled reports
   */
  calculateNextRun(schedule) {
    const now = new Date();
    
    switch (schedule) {
      case 'daily':
        return new Date(now.setDate(now.getDate() + 1));
      case 'weekly':
        return new Date(now.setDate(now.getDate() + 7));
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
      default:
        return new Date(now.setDate(now.getDate() + 7));
    }
  }
}

module.exports = new EmailReportsService();