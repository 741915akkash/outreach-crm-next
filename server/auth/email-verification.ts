import { sendEmail } from '@server/services/email/send-email';

export const emailVerification = {
  sendOnSignUp: true,
  sendOnSignIn: true,
  autoSignInAfterVerification: true,
  expiresIn: 60 * 60,

  sendVerificationEmail: async ({
    user,
    url,
  }: {
    user: { email: string; name: string };
    url: string;
  }) => {
    await sendEmail({
      to: user.email,
      subject: 'Verify your Outreach CRM email',
      text: [
        `Hello ${user.name},`,
        '',
        'Please verify your email address using the link below:',
        url,
        '',
        'This link expires in one hour.',
      ].join('\n'),
    }).catch((error) => {
      console.error('Failed to send verification email:', error);
    });
  },
};
