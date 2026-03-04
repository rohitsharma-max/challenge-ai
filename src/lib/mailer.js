import nodemailer from 'nodemailer';

const OTP_TTL_MINUTES = 10;

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export async function sendSignupOtpEmail({ to, name, otp }) {
  return sendOtpEmail({
    to,
    name,
    otp,
    subject: 'Your verification code',
    heading: 'Verify your email',
    intro: 'Your verification code is:',
  });
}

export async function sendResetPasswordOtpEmail({ to, name, otp }) {
  return sendOtpEmail({
    to,
    name,
    otp,
    subject: 'Your password reset code',
    heading: 'Reset your password',
    intro: 'Your password reset code is:',
  });
}

async function sendOtpEmail({ to, name, otp, subject, heading, intro }) {
  const from = process.env.EMAIL_FROM;
  const smtp = getTransporter();

  if (!to || !otp) return false;

  if (!smtp || !from) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[DEV OTP] Email: ${to} OTP: ${otp}`);
      return true;
    }
    console.error('Missing SMTP config or EMAIL_FROM for OTP delivery.');
    return false;
  }

  const firstName = (name || 'there').trim().split(' ')[0];
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
      <h2>${heading}</h2>
      <p>Hi ${firstName},</p>
      <p>${intro}</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p>
      <p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>
      <p>If you did not create this account, you can ignore this email.</p>
    </div>
  `;

  try {
    await smtp.sendMail({
      from,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('OTP email send failed:', err);
    return false;
  }
}
