const axios = require('axios');

class MpesaAPIService {
  constructor() {
    // Safaricom M-PESA API
    this.baseUrl = process.env.MPESA_API_URL;
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.passkey = process.env.MPESA_PASSKEY;
    this.shortCode = process.env.MPESA_SHORTCODE;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000
    });
  }

  /**
   * Get authentication token
   */
  async getAuthToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      
      const response = await this.client.get('/oauth/v1/generate?grant_type=client_credentials', {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      return response.data.access_token;
    } catch (error) {
      throw new Error('Failed to authenticate with M-PESA');
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId) {
    try {
      const token = await this.getAuthToken();
      
      const response = await this.client.post('/mpesa/transactionstatus/v1/query', {
        BusinessShortCode: this.shortCode,
        Password: this.generatePassword(),
        Timestamp: this.getTimestamp(),
        TransactionID: transactionId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        id: response.data.TransactionID,
        amount: response.data.TransactionAmount,
        status: response.data.TransactionStatus,
        date: response.data.TransactionDate,
        customer: response.data.CustomerName,
        phone: response.data.MSISDN
      };
    } catch (error) {
      throw new Error('Failed to fetch transaction');
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(shortCode) {
    try {
      const token = await this.getAuthToken();
      
      const response = await this.client.post('/mpesa/accountbalance/v1/query', {
        BusinessShortCode: shortCode,
        Password: this.generatePassword(),
        Timestamp: this.getTimestamp()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        account: response.data.Account,
        balance: response.data.Balance,
        currency: 'KES'
      };
    } catch (error) {
      throw new Error('Failed to fetch account balance');
    }
  }

  /**
   * Get transactions for date range
   */
  async getTransactions(startDate, endDate) {
    try {
      const token = await this.getAuthToken();
      
      const response = await this.client.post('/mpesa/transactions/v1/query', {
        BusinessShortCode: this.shortCode,
        StartDate: startDate,
        EndDate: endDate,
        Password: this.generatePassword(),
        Timestamp: this.getTimestamp()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return response.data.Transactions.map(t => ({
        id: t.TransactionID,
        amount: t.TransactionAmount,
        type: t.TransactionType,
        status: t.TransactionStatus,
        date: t.TransactionDate,
        customer: t.CustomerName
      }));
    } catch (error) {
      throw new Error('Failed to fetch transactions');
    }
  }

  generatePassword() {
    const timestamp = this.getTimestamp();
    const data = this.shortCode + this.passkey + timestamp;
    return Buffer.from(data).toString('base64');
  }

  getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}

module.exports = new MpesaAPIService();