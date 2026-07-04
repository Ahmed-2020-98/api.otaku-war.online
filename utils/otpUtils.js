const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateOTPWithExpiry = () => ({
  otp: generateOTP(),
  otpExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), //24 hours
});

module.exports = { generateOTP, generateOTPWithExpiry };
