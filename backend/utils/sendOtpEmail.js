const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

exports.sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"LocalMarket Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your LocalMarket verification code: ${otp}`,

    // 1. Plaintext fallback (crucial for spam score):
    text: `Your LocalMarket verification code is: ${otp}. It expires in 10 minutes. If you did not request this, please ignore this email.`,

    // 2. HTML template:
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; margin: 0 0 12px;">Verify Your Account</h2>
        <p style="color: #475569; font-size: 14px;">Use the code below to complete your LocalMarket signup:</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; text-align: center; border-radius: 8px; margin: 16px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #166534;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #64748b; margin: 0;">This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};