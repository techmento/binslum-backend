const nodemailer = require('nodemailer');

// Create transporter from environment variables
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT || 587;

  if (!host || !user || !pass) {
    console.warn('SMTP not configured - emails will not be sent');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  });
}

async function sendEmail({ to, subject, html }) {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn('Email not sent - SMTP not configured', { to, subject });
    return;
  }

  try {
    const from = process.env.SMTP_FROM || 'noreply@binslum.com';

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log('Email sent successfully', { to, subject });
  } catch (err) {
    console.error('Failed to send email', { to, subject, error: err.message });
    throw err;
  }
}

module.exports = {
  sendEmail,
};
