/**
 * M-Pesa Integration Service
 * Handles Safaricom M-Pesa API integration
 */

const crypto = require('crypto');
const axios = require('axios');
const config = require('./config/integrations.config');
const logger = require('../config/logger');
const { IntegrationError } = require('./utils/http-client');

class MpesaService {
  constructor() {
    this.config = config.mpesa;
    this.baseUrl = this.config.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
    
    this.accessToken = null;
    this.tokenExpiry = null;
    
    logger.info(`M-Pesa service initialized in ${this.config.environment} mode`);
  }

  /**
   * Get OAuth access token
   */
  async getAccessToken() {
    try {
      // Check if token is still valid
      if (this.accessToken && this.tokenExpiry > Date.now()) {
        return this.accessToken;
      }

      const auth = Buffer.from(
        `${this.config.consumerKey}:${this.config.consumerSecret}`
      ).toString('base64');

      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 minute early

      logger.info('M-Pesa access token obtained successfully');

      return this.accessToken;
    } catch (error) {
      logger.error('Failed to get M-Pesa access token:', error);
      throw new IntegrationError('Failed to authenticate with M-Pesa', 500);
    }
  }

  /**
   * Generate security credential
   */
  generateSecurityCredential() {
    const publicKey = `-----BEGIN PUBLIC KEY-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwQHN5V7Nf0kKvVYcYzYV
      ... (your public key here) ...
      4QIDAQAB
      -----END PUBLIC KEY-----`;

    return crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING
      },
      Buffer.from(this.config.passkey)
    ).toString('base64');
  }

  /**
   * Generate timestamp in format YYYYMMDDHHmmss
   */
  generateTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Generate password for STK push
   */
  generatePassword(shortCode, passkey, timestamp) {
    const str = `${shortCode}${passkey}${timestamp}`;
    return Buffer.from(str).toString('base64');
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa Online)
   * @param {Object} paymentData - Payment details
   */
  async stkPush(paymentData) {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(
        this.config.shortCode,
        this.config.passkey,
        timestamp
      );

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        {
          BusinessShortCode: this.config.shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(paymentData.amount),
          PartyA: this.formatPhoneNumber(paymentData.phoneNumber),
          PartyB: this.config.shortCode,
          PhoneNumber: this.formatPhoneNumber(paymentData.phoneNumber),
          CallBackURL: this.config.callbackUrl,
          AccountReference: paymentData.reference || 'PitchPoa',
          TransactionDesc: paymentData.description || 'Payment for goods/services'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      logger.info(`STK Push initiated for ${paymentData.phoneNumber}`, {
        checkoutRequestID: response.data.CheckoutRequestID,
        amount: paymentData.amount
      });

      return {
        success: true,
        checkoutRequestID: response.data.CheckoutRequestID,
        responseCode: response.data.ResponseCode,
        responseDescription: response.data.ResponseDescription,
        customerMessage: response.data.CustomerMessage
      };
    } catch (error) {
      logger.error('STK Push failed:', error);
      throw new IntegrationError('STK Push failed', 500, error.response?.data);
    }
  }

  /**
   * Query STK Push status
   * @param {string} checkoutRequestID - Checkout request ID
   */
  async querySTKStatus(checkoutRequestID) {
    try {
      const token = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(
        this.config.shortCode,
        this.config.passkey,
        timestamp
      );

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        {
          BusinessShortCode: this.config.shortCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestID
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        resultCode: response.data.ResultCode,
        resultDesc: response.data.ResultDesc,
        amount: response.data.amount,
        mpesaReceiptNumber: response.data.MpesaReceiptNumber,
        phoneNumber: response.data.PhoneNumber
      };
    } catch (error) {
      logger.error('STK status query failed:', error);
      throw new IntegrationError('Failed to query STK status', 500);
    }
  }

  /**
   * Handle STK Push callback
   * @param {Object} callbackData - Callback data from M-Pesa
   */
  async handleSTKCallback(callbackData) {
    logger.info('STK Push callback received:', callbackData);

    const { Body: { stkCallback } } = callbackData;

    const result = {
      checkoutRequestID: stkCallback.CheckoutRequestID,
      resultCode: stkCallback.ResultCode,
      resultDesc: stkCallback.ResultDesc,
      amount: stkCallback.CallbackMetadata?.Item?.find(item => item.Name === 'Amount')?.Value,
      mpesaReceiptNumber: stkCallback.CallbackMetadata?.Item?.find(item => item.Name === 'MpesaReceiptNumber')?.Value,
      phoneNumber: stkCallback.CallbackMetadata?.Item?.find(item => item.Name === 'PhoneNumber')?.Value,
      transactionDate: stkCallback.CallbackMetadata?.Item?.find(item => item.Name === 'TransactionDate')?.Value
    };

    // Update transaction in database
    // This would integrate with your database service

    return {
      success: true,
      processed: true,
      result
    };
  }

  /**
   * Initiate B2C payment (Business to Customer)
   * @param {Object} paymentData - Payment details
   */
  async b2cPayment(paymentData) {
    try {
      const token = await this.getAccessToken();
      const securityCredential = this.generateSecurityCredential();

      const response = await axios.post(
        `${this.baseUrl}/mpesa/b2c/v1/paymentrequest`,
        {
          InitiatorName: 'apitest',
          SecurityCredential: securityCredential,
          CommandID: 'BusinessPayment',
          Amount: paymentData.amount,
          PartyA: this.config.shortCode,
          PartyB: this.formatPhoneNumber(paymentData.phoneNumber),
          Remarks: paymentData.remarks || 'Payment',
          QueueTimeOutURL: this.config.timeoutUrl,
          ResultURL: this.config.resultUrl,
          Occasion: paymentData.occasion || ''
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      logger.info(`B2C payment initiated to ${paymentData.phoneNumber}`);

      return {
        success: true,
        conversationID: response.data.ConversationID,
        originatorConversationID: response.data.OriginatorConversationID,
        responseCode: response.data.ResponseCode
      };
    } catch (error) {
      logger.error('B2C payment failed:', error);
      throw new IntegrationError('B2C payment failed', 500);
    }
  }

  /**
   * Check account balance
   */
  async checkBalance() {
    try {
      const token = await this.getAccessToken();
      const securityCredential = this.generateSecurityCredential();
      const timestamp = this.generateTimestamp();

      const response = await axios.post(
        `${this.baseUrl}/mpesa/accountbalance/v1/query`,
        {
          Initiator: 'apitest',
          SecurityCredential: securityCredential,
          CommandID: 'AccountBalance',
          PartyA: this.config.shortCode,
          IdentifierType: '4',
          Remarks: 'Balance check',
          QueueTimeOutURL: this.config.timeoutUrl,
          ResultURL: this.config.resultUrl
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        conversationID: response.data.ConversationID,
        responseCode: response.data.ResponseCode
      };
    } catch (error) {
      logger.error('Balance check failed:', error);
      throw new IntegrationError('Failed to check M-Pesa balance', 500);
    }
  }

  /**
   * Reverse transaction
   * @param {Object} reversalData - Reversal details
   */
  async reverseTransaction(reversalData) {
    try {
      const token = await this.getAccessToken();
      const securityCredential = this.generateSecurityCredential();

      const response = await axios.post(
        `${this.baseUrl}/mpesa/reversal/v1/request`,
        {
          Initiator: 'apitest',
          SecurityCredential: securityCredential,
          CommandID: 'TransactionReversal',
          TransactionID: reversalData.transactionID,
          Amount: reversalData.amount,
          ReceiverParty: reversalData.receiverParty,
          ReceiverIdentifierType: '11',
          Remarks: reversalData.remarks || 'Reversal',
          QueueTimeOutURL: this.config.timeoutUrl,
          ResultURL: this.config.resultUrl
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      logger.info(`Transaction reversal initiated: ${reversalData.transactionID}`);

      return {
        success: true,
        conversationID: response.data.ConversationID,
        responseCode: response.data.ResponseCode
      };
    } catch (error) {
      logger.error('Transaction reversal failed:', error);
      throw new IntegrationError('Failed to reverse transaction', 500);
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Kenyan numbers
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '254' + cleaned;
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  }
}

module.exports = new MpesaService();