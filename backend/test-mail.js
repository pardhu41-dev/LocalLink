const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const nodemailer = require('nodemailer');

console.log('Testing with EMAIL_USER:', process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

transporter.sendMail({
  from: `"LocalMarket Security" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_USER,
  subject: 'LocalMarket SMTP Self-Test',
  text: 'If you receive this, your Gmail SMTP connection is working perfectly!'
})
  .then(info => console.log('✅ Mail sent successfully! ID:', info.messageId))
  .catch(err => console.error('❌ Error sending mail:', err.message));
