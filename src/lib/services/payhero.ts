// PayHero service class for handling payments
import axios from 'axios';

class PayHeroService {
  private baseUrl: string = 'https://backend.payhero.co.ke';
  private channelId: string;
  private accountId: string;
  private authToken: string;

  constructor() {
    this.channelId = '3838';
    this.accountId = '3278';
    // Base64 encoded credentials: 9fYU0LoRJGggJoRhpCs:H4Du1TA5SOCvBK1RO9u15yBhk1WXXl4VLro4JK40
    this.authToken = 'Basic OWZZWVUwTG9SSkdnZ0pvUmhwQ3M6SDREdWwxQTVTT0N2QksxUk85dTE1eUJoazFXWHhJNFZMcm80Sks0MA==';
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.authToken,
      'Accept': 'application/json'
    };
  }

  async initiatePayment(params: {
    amount: number;
    phone_number: string;
    external_reference: string;
    customer_name?: string;
    callback_url: string;
  }) {
    try {
      const paymentData = {
        ...params,
        provider: 'm-pesa',
        channel_id: parseInt(this.channelId),
        client_id: this.accountId
      };

      console.log('Payment Request:', {
        url: `${this.baseUrl}/api/v2/payments`,
        headers: {
          ...this.getHeaders(),
          'Authorization': 'Basic [MASKED]'
        },
        data: {
          ...paymentData,
          phone_number: '****' + paymentData.phone_number.slice(-4)
        }
      });

      const response = await axios.post(
        `${this.baseUrl}/api/v2/payments`,
        paymentData,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('PayHero Payment Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  async checkPaymentStatus(referenceNumber: string) {
    if (!referenceNumber || typeof referenceNumber !== 'string') {
      return {
        success: false,
        error: {
          code: 'INVALID_REFERENCE',
          message: 'Invalid payment reference number'
        }
      };
    }

    try {
      // Use the documented query parameter format: ?reference=<reference>
      const url = `${this.baseUrl}/api/v2/transaction-status?reference=${encodeURIComponent(referenceNumber)}`;
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000 // 10 second timeout
      });

      // Normalize response
      const data = response.data || {};
      return {
        success: true,
        data,
        status: data.status || data.response?.status || 'QUEUED',
        provider_reference: data.provider_reference || data.third_party_reference || data.response?.MpesaReceiptNumber,
        third_party_reference: data.third_party_reference || data.response?.third_party_reference,
        transaction_date: data.transaction_date || new Date().toISOString()
      };
    } catch (error: any) {
      // Handle network timeout/errors
      if (!error.response) {
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error while checking payment status'
          }
        };
      }

      // Special handling for 404 (transaction not yet in system)
      if (error.response?.status === 404) {
        return {
          success: false,
          status: 'QUEUED',
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction is being processed or not yet indexed'
          }
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  // Compatibility method: PaymentModal expects checkTransactionStatus
  async checkTransactionStatus(referenceNumber: string) {
    const result = await this.checkPaymentStatus(referenceNumber);
    // If result has normalized fields return them, otherwise map
    if (result && (result.status || result.data)) {
      return {
        status: result.status || result.data?.status || (result.data?.response ? 'SUCCESS' : 'QUEUED'),
        provider_reference: result.provider_reference || result.data?.provider_reference || result.data?.response?.MpesaReceiptNumber,
        third_party_reference: result.third_party_reference || result.data?.third_party_reference || result.data?.response?.third_party_reference,
        transaction_date: result.transaction_date || result.data?.transaction_date || new Date().toISOString(),
        success: result.success,
        error: result.error
      };
    }

    return {
      status: 'QUEUED',
      provider_reference: undefined,
      third_party_reference: undefined,
      transaction_date: new Date().toISOString(),
      success: false,
      error: result?.error || { message: 'Unknown error' }
    };
  }
}

export const payHeroService = new PayHeroService();