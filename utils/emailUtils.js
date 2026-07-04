const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { google } = require("googleapis");

dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENTID,
  process.env.OAUTH_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.OAUTH_REFRESH_TOKEN,
});

async function createTransporter() {
  const accessToken = await oAuth2Client.getAccessToken();
  return nodemailer.createTransport({
    service: "gmail",
    port: 587,
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      clientId: process.env.OAUTH_CLIENTID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
      accessToken: accessToken.token,
    },
  });
}

const sendEmail = async (email, subject, html, text = null) => {
  const transporter = await createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html,
    ...(text && { text }),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.log(error);
    throw new Error("Failed to send email");
  }
};

// Non-blocking email sending with retry logic
const sendEmailAsync = async (
  email,
  subject,
  html,
  userId = null,
  retryCount = 0
) => {
  const maxRetries = 3;
  const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff

  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to: ${email}`, { userId, retryCount });

    return { success: true };
  } catch (error) {
    console.error(`Email sending failed (attempt ${retryCount + 1}):`, {
      email,
      error: error.message,
      userId,
    });

    // Retry logic
    if (retryCount < maxRetries) {
      console.log(`Retrying email send in ${retryDelay}ms...`);
      setTimeout(() => {
        sendEmailAsync(email, subject, html, userId, retryCount + 1);
      }, retryDelay);
    } else {
      console.error(`Max retries exceeded for email: ${email}`, { userId });
    }
  }
};

module.exports = { sendEmail, sendEmailAsync };
