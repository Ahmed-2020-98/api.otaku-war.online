const config = require("./config");

const upaymentsConfig = {
  // Test environment
  test: {
    baseUrl: "https://sandboxapi.upayments.com/api/v1",
    token: process.env.UPAYMENTS_TEST_TOKEN,
    // merchantId: process.env.UPAYMENTS_TEST_MERCHANT_ID,
  },
  // Production environment
  production: {
    baseUrl: "https://apiv2api.upayments.com/api/v1",
    token: process.env.UPAYMENTS_PROD_TOKEN,
    merchantId: process.env.UPAYMENTS_PROD_MERCHANT_ID,
  },
};

const getUpaymentsConfig = () => {
  return process.env.NODE_ENV === "production"
    ? upaymentsConfig.production
    : upaymentsConfig.test;
};

module.exports = { upaymentsConfig, getUpaymentsConfig };
