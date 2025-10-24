const axios = require('axios');

// Replace with your webhook URL
const webhookUrl = 'YOUR_WEBHOOK_URL';

const testPayload = {
  response: {
    Amount: 100,
    CheckoutRequestID: 'test-checkout-id',
    ExternalReference: '-Obr7iiiedoOol5OPQuU', // Use your actual reference
    MpesaReceiptNumber: 'TEST123456',
    Phone: '254722000000',
    ResultCode: 0,
    ResultDesc: 'The service request is processed successfully.',
    Status: 'Success'
  }
};

async function testWebhook() {
  try {
    const response = await axios.post(webhookUrl, testPayload);
    console.log('Webhook test response:', response.data);
  } catch (error) {
    console.error('Webhook test failed:', error.response?.data || error.message);
  }
}

testWebhook();