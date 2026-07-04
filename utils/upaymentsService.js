const axios = require("axios");
const { getUpaymentsConfig } = require("../config/upayments");

class UPaymentsService {
  constructor() {
    this.config = getUpaymentsConfig();
    if (!this.config.baseUrl || !this.config.token) {
      // Don't crash the whole server at boot if payments aren't configured yet.
      // Payment endpoints will error at call time until UPAYMENTS_*_TOKEN is set.
      console.warn(
        "UPayments not fully configured (missing token); payment features are disabled until UPAYMENTS_PROD_TOKEN/UPAYMENTS_TEST_TOKEN is set."
      );
      this.client = null;
      return;
    }
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      headers: {
        Authorization: `Bearer ${this.config.token}`,
        "Content-Type": "application/json",
      },
    });
  }

  // Create customer unique token
  //   async createCustomerToken(customerUniqueToken) {
  //     try {
  //       const response = await this.client.post("/create-customer-unique-token", {
  //         customerUniqueToken: parseInt(customerUniqueToken),
  //       });
  //       return response.data;
  //     } catch (error) {
  //       console.error(
  //         "Error creating customer token:",
  //         error.response?.data || error.message
  //       );
  //       throw error;
  //     }
  //   }

  // Create payment charge
  async createCharge(chargeData) {
    try {
      const response = await this.client.post("/charge", chargeData);
      return response.data;
    } catch (error) {
      console.error(
        "Error creating charge:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Get payment status
  async getPaymentStatus(orderId) {
    try {
      const response = await this.client.get(`/payment-status/${orderId}`);
      return response.data;
    } catch (error) {
      console.error(
        "Error getting payment status:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Build charge request data following the exact UPayments structure
  buildChargeRequest({
    orderId,
    packageName,
    packageCredits,
    amount,
    description,
    // customerUniqueToken,
    returnUrl,
    cancelUrl,
    notificationUrl,
    customerData,
    language = "en",
    customerExtraData = "User define data",
  }) {
    return {
      products: [
        {
          name: packageName,
          description: description,
          price: amount,
          quantity: 1,
        },
      ],
      order: {
        id: orderId,
        reference: orderId,
        description: description,
        currency: "KWD",
        amount: amount,
      },
      language: language,
      reference: {
        id: orderId,
      },
      customer: {
        uniqueId: customerData.userId,
        name: customerData.fullName,
        email: customerData.email,
      },
      returnUrl: returnUrl,
      cancelUrl: cancelUrl,
      notificationUrl: notificationUrl,
      customerExtraData: customerExtraData,
    };
  }
}

module.exports = new UPaymentsService();
