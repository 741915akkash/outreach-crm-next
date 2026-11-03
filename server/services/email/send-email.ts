import 'server-only';

import { getEmailTransport } from './transport';

type SendEmailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  if (!text && !html) {
    throw new Error('Email must contain either text or HTML content.');
  }

  const from = process.env.SMTP_FROM;

  if (!from) {
    throw new Error('SMTP_FROM is not configured.');
  }

  const transport = getEmailTransport();

  return transport.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}
