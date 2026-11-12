import nodemailer from 'nodemailer';

function getSmtpConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD } =
    process.env;

  if (!SMTP_HOST || !SMTP_PORT) {
    throw new Error(
      'SMTP is not configured. Check your environment variables.',
    );
  }

  if (Boolean(SMTP_USER) !== Boolean(SMTP_PASSWORD)) {
    throw new Error(
      'SMTP_USER and SMTP_PASSWORD must both be configured or both omitted.',
    );
  }

  const port = Number(SMTP_PORT);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('SMTP_PORT must be a valid port number.');
  }

  return {
    host: SMTP_HOST,
    port,
    secure: SMTP_SECURE === 'true',
    ...(SMTP_USER && SMTP_PASSWORD
      ? {
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD,
          },
        }
      : {}),
  };
}

export function getEmailTransport() {
  return nodemailer.createTransport(getSmtpConfig());
}
