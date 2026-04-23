// utils/sendEmail.js — Nodemailer email utility

const nodemailer = require('nodemailer');

/**
 * sendEmail({ to, subject, html, text })
 * Uses SMTP config from environment variables.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  // Create reusable transporter
  const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for others
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from:    `"${process.env.FROM_NAME || 'STUNET'}" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html:  html  || undefined,
    text:  text  || undefined,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;