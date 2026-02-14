import nodemailer from 'nodemailer';
// remove gmail from here use brevo or sendgrid or aws
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: process.env.EMAIL_CLIENT_HOST,
  port: process.env.EMAIL_CLIENT_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_CLIENT_LOGIN,
    pass: process.env.EMAIL_CLIENT_KEY,
  },
});

const sendMail = async (composedEmail) => {
  try {
    console.log('in sendMail');
    const info = await transporter.sendMail({
      ...composedEmail,
    });
    console.log('otp sent', info.messageId);
  } catch (error) {
    console.error(error.message);
  }
};

const appName = process.env.APP_NAME;
const appMail = process.env.APP_MAIL;
const otpMailTemplate = ({ to, otp, expiryMinutes }) => {
  return {
    from: appMail,
    to: to,
    subject: 'Your verification code ',
    text: `
Your verification code is: ${otp}

This code will expire in ${expiryMinutes} minutes.

If you didn’t request this, you can safely ignore this email.

— ${appName} Security Team
`.trim(),

    html: `
<p>Hello,</p>

<p>Your verification code is:</p>

<p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">
  ${otp}
</p>

<p>This code will expire in <strong>${expiryMinutes} minutes</strong>.</p>

<p>If you didn’t request this, you can safely ignore this email.</p>

<hr />

<p style="font-size: 12px; color: #666;">
  ${appName} Security Team
</p>
`,
  };
};

function actionEmailTemplate({ to, userName, actionName, actionLink, expiryMinutes }) {
  return {
    from: appMail,
    to,
    subject: `Confirm your ${actionName}`,
    text: `
Hello ${userName},

We received a request to ${actionName} for your ${appName} account.

Open the link below to continue:
${actionLink}

This link will expire in ${expiryMinutes} minutes and can only be used once.

If you did not request this action, you can safely ignore this email.

— ${appName} Security Team
`.trim(),

    html: `
<p>Hello ${userName},</p>

<p>
  We received a request to <strong>${actionName}</strong> for your
  <strong>${appName}</strong> account.
</p>

<p>
  <a
    href="${actionLink}"
    style="
      display: inline-block;
      padding: 10px 16px;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
    "
  >
    Confirm ${actionName}
  </a>
</p>

<p>
  This link will expire in <strong>${expiryMinutes} minutes</strong>
  and can only be used once.
</p>

<p>
  If you did not request this action, you can safely ignore this email.
</p>

<hr />

<p style="font-size: 12px; color: #666;">
  ${appName} Security Team
</p>
`,
  };
}

export { sendMail, otpMailTemplate, actionEmailTemplate };
