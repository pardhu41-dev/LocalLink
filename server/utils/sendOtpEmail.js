const nodemailer = require('nodemailer');

const getTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

exports.sendOtpEmail = async (email, otp) => {
  console.log(`\n======================================================`);
  console.log(`📨 [OTP EMAIL DISPATCH] Recipient: ${email}`);
  console.log(`🔑 [VERIFICATION CODE]: ${otp} (Valid for 10 minutes)`);
  console.log(`======================================================\n`);

  const mailOptions = {
    from: `"LocalMarket Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} is your LocalMarket verification code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">Verify Your Email</h2>
        <p style="color: #475569; font-size: 14px;">Use the verification code below to complete your registration on LocalMarket:</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #166534;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `
  };

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log(`[sendOtpEmail] Real email dispatched successfully! ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[sendOtpEmail] SMTP delivery failed:`, error.message);
    throw error;
  }
};