const path = require('path');

// Allow resolving dependencies from backend/node_modules if running inside server/
const backendNodeModules = path.resolve(__dirname, '../backend/node_modules');
if (!module.paths.includes(backendNodeModules)) {
  module.paths.unshift(backendNodeModules);
}

// Load environment variables from backend/.env
require(path.join(backendNodeModules, 'dotenv')).config({
  path: path.resolve(__dirname, '../backend/.env')
});

const nodemailer = require(path.join(backendNodeModules, 'nodemailer'));

console.log('Testing SMTP connection for:', process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD
  }
});

transporter.sendMail({
  from: `"LocalMarket Security" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_USER, // Sends an email to yourself
  subject: 'LocalMarket SMTP Test',
  text: 'If you receive this, your Gmail SMTP connection is working perfectly!'
})
  .then(info => console.log('✅ Mail sent successfully! ID:', info.messageId))
  .catch(err => console.error('❌ Error sending mail:', err.message));
