const nodemailer = require('nodemailer');

/**
 * Creates a reusable Nodemailer transporter from env variables.
 * Works with Gmail App Passwords, Outlook, SendGrid SMTP, etc.
 */
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error('EMAIL_USER and EMAIL_APP_PASSWORD must be set in .env');
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

/**
 * Sends a verification email with a clean, responsive HTML template.
 *
 * @param {string} toEmail   - Recipient email address
 * @param {string} toName    - Recipient display name
 * @param {string} rawToken  - The unhashed token (goes in the URL, never stored)
 */
const sendVerificationEmail = async (toEmail, toName, rawToken) => {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your LocalLink email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;
                 box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2E7D32 0%,#1B5E20 100%);
                        padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#AEEA00;font-size:28px;font-weight:800;
                          letter-spacing:1px;">LocalLink</h1>
              <p style="margin:8px 0 0;color:#C8E6C9;font-size:14px;">
                Your Local Community Marketplace
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 16px;color:#1B5E20;font-size:22px;font-weight:700;">
                Welcome, ${toName}! 👋
              </h2>
              <p style="margin:0 0 24px;color:#444;font-size:16px;line-height:1.6;">
                Thanks for joining <strong>LocalLink</strong>. To activate your account and 
                start buying, selling, and trading with your community, please verify your 
                email address.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#2E7D32,#1B5E20);
                              color:#AEEA00;text-decoration:none;font-size:16px;font-weight:700;
                              padding:16px 40px;border-radius:50px;
                              box-shadow:0 4px 12px rgba(46,125,50,0.35);
                              letter-spacing:0.5px;">
                      ✓ &nbsp;Verify My Email
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#666;font-size:13px;line-height:1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${verifyUrl}"
                   style="color:#2E7D32;font-size:13px;text-decoration:underline;">
                  ${verifyUrl}
                </a>
              </p>

              <!-- Expiry notice -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#FFF8E1;border-left:4px solid #FFC107;
                              border-radius:4px;padding:14px 16px;">
                    <p style="margin:0;color:#795548;font-size:13px;">
                      ⏱ This link expires in <strong>24 hours</strong>. 
                      If you didn't create a LocalLink account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f4f6f8;padding:24px 40px;text-align:center;
                        border-top:1px solid #e0e0e0;">
              <p style="margin:0;color:#999;font-size:12px;line-height:1.6;">
                © ${new Date().getFullYear()} LocalLink · Your Local Community Marketplace<br/>
                You received this email because you registered at LocalLink.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const transporter = createTransporter();

  const info = await transporter.sendMail({
    from: `"LocalLink" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '✅ Verify your LocalLink email address',
    html,
    // Plain-text fallback for email clients that don't render HTML
    text: `Hi ${toName},\n\nPlease verify your LocalLink email by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't register, ignore this email.\n\n— The LocalLink Team`
  });

  console.log(`[sendEmail] Verification email sent to ${toEmail} — Message ID: ${info.messageId}`);
  return info;
};

module.exports = { sendVerificationEmail };
