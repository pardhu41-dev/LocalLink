const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

exports.sendPasswordResetOtpEmail = async (email, otp) => {
    const mailOptions = {
        from: `"LocalMarket Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Your LocalMarket Password Reset Code: ${otp}`,
        text: `Your password reset code is: ${otp}. It expires in 10 minutes. If you did not request a password reset, please ignore this email.`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #059669; margin-top: 0;">Reset Your Password</h2>
        <p style="color: #475569; font-size: 14px;">We received a request to reset your password. Use the verification code below:</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #166534;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">This code is valid for 10 minutes. If you did not request this, you can safely ignore this message.</p>
      </div>
    `
    };

    return transporter.sendMail(mailOptions);
};