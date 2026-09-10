import nodemailer from "nodemailer";

interface SendWelcomeEmailParams {
  to: string;
  name: string;
  username: string;
  tempPassword: string;
  resetToken: string;
  role: string;
  branchName?: string;
}

interface SendPasswordResetParams {
  to: string;
  name: string;
  resetToken: string;
}

const getAppUrl = () => {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
};

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

/**
 * Dispatches onboarding welcome email to a newly created officer.
 */
export async function sendWelcomeNewUserEmail(params: SendWelcomeEmailParams) {
  const { to, name, username, tempPassword, resetToken, role, branchName } = params;
  const appUrl = getAppUrl();
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const from = process.env.SMTP_FROM || `"DVLA VPMS" <no-reply@dvla.gov.gh>`;

  const subject = "Welcome to DVLA VPMS — Your Account & Access Credentials";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #103014 0%, #1a4a1f 100%); padding: 28px 32px; text-align: center; color: #ffffff; border-bottom: 3px solid #81B71A; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 12px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px; }
    .body { padding: 32px; }
    .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
    .lead { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .card { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .credential-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
    .credential-row:last-child { margin-bottom: 0; }
    .label { color: #64748b; font-weight: 500; }
    .val { color: #0f172a; font-weight: 600; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #81B71A 0%, #689914 100%); color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(129, 183, 26, 0.3); }
    .link-alt { font-size: 12px; color: #64748b; line-height: 1.5; word-break: break-all; margin-top: 16px; }
    .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DVLA VPMS</h1>
      <p>Driver &amp; Vehicle Licensing Authority &bull; Republic of Ghana</p>
    </div>
    <div class="body">
      <div class="greeting">Hello ${name},</div>
      <div class="lead">
        An official officer account has been provisioned for you on the <strong>DVLA Vehicle Plate Management System (VPMS)</strong>.
        Below are your authorized credentials and station assignments:
      </div>

      <div class="card">
        <div class="credential-row">
          <span class="label">Assigned Username:</span>
          <span class="val" style="color: #047857; font-size: 14px;">${username}</span>
        </div>
        <div class="credential-row">
          <span class="label">Official Email:</span>
          <span class="val">${to}</span>
        </div>
        <div class="credential-row">
          <span class="label">Assigned Station:</span>
          <span class="val">${branchName || "DVLA Head Office"}</span>
        </div>
        <div class="credential-row">
          <span class="label">Access Role:</span>
          <span class="val">${role}</span>
        </div>
        <div class="credential-row" style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
          <span class="label">Temporary Password:</span>
          <span class="val" style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${tempPassword}</span>
        </div>
      </div>

      <div class="lead">
        To activate your account and set your permanent secure password, please click the button below:
      </div>

      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank">Activate Account &amp; Set Password</a>
      </div>

      <div class="link-alt">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #0284c7;">${resetUrl}</a>
      </div>

      <p style="font-size: 12px; color: #dc2626; margin-top: 24px;">
        &bull; Notice: For security protocols, this one-time activation link is valid for 24 hours.
      </p>
    </div>
    <div class="footer">
      This is an automated notification from the DVLA VPMS Enterprise Authentication Gateway.<br>
      &copy; ${new Date().getFullYear()} Driver &amp; Vehicle Licensing Authority (DVLA), Ghana.
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Welcome to DVLA VPMS, ${name}!

An officer account has been created for you on the Driver & Vehicle Licensing Authority (DVLA) VPMS portal.

Assigned Username: ${username}
Official Email: ${to}
Station: ${branchName || "DVLA Station"}
Role: ${role}
Temporary Password: ${tempPassword}

Please activate your account and choose your personal secure password by visiting the link below:
${resetUrl}

(Link expires in 24 hours).
  `.trim();

  // Always log to server console for transparent development & testing
  console.log("\n" + "=".repeat(68));
  console.log("📧 [DVLA VPMS EMAIL DISPATCH - WELCOME NEW OFFICER]");
  console.log(`To: ${to} (${name})`);
  console.log(`Username: ${username}`);
  console.log(`Temporary Password: ${tempPassword}`);
  console.log(`Station: ${branchName || "Adenta HQ"} | Role: ${role}`);
  console.log(`Activation Link: ${resetUrl}`);
  console.log("=".repeat(68) + "\n");

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`✅ Email delivered successfully via SMTP to ${to}`);
      return { success: true, delivered: true };
    } catch (err) {
      console.error(`❌ SMTP delivery failed to ${to}:`, err);
      return { success: true, delivered: false, error: (err as any)?.message };
    }
  } else {
    console.log("ℹ️ SMTP credentials not configured in .env; logged to console for testing.");
    return { success: true, delivered: false, note: "Logged to server console" };
  }
}

/**
 * Dispatches password reset email when requested.
 */
export async function sendPasswordResetEmail(params: SendPasswordResetParams) {
  const { to, name, resetToken } = params;
  const appUrl = getAppUrl();
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const from = process.env.SMTP_FROM || `"DVLA VPMS" <no-reply@dvla.gov.gh>`;

  const subject = "DVLA VPMS — Password Reset Request";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #103014; padding: 24px; text-align: center; color: #ffffff; border-bottom: 3px solid #81B71A; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 700; }
    .body { padding: 28px; }
    .lead { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
    .btn-container { text-align: center; margin: 24px 0; }
    .btn { display: inline-block; background: #81B71A; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; }
    .link-alt { font-size: 11px; color: #64748b; line-height: 1.5; word-break: break-all; margin-top: 16px; }
    .footer { background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>DVLA VPMS &bull; Password Reset</h1>
    </div>
    <div class="body">
      <p class="lead">Hello ${name},</p>
      <p class="lead">
        A password reset was requested for your DVLA VPMS officer account.
        Click the button below to specify a new password:
      </p>

      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
      </div>

      <div class="link-alt">
        Direct link:<br>
        <a href="${resetUrl}" style="color: #0284c7;">${resetUrl}</a>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
        This link is valid for <strong>1 hour</strong>. If you did not initiate this request, you can safely disregard this message.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Driver &amp; Vehicle Licensing Authority (DVLA)
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Hello ${name},

A password reset was requested for your DVLA VPMS account.
Please visit the link below to set your new password:
${resetUrl}

This link is valid for 1 hour.
  `.trim();

  console.log("\n" + "=".repeat(68));
  console.log("📧 [DVLA VPMS EMAIL DISPATCH - PASSWORD RESET REQUEST]");
  console.log(`To: ${to} (${name})`);
  console.log(`Reset Link: ${resetUrl}`);
  console.log("=".repeat(68) + "\n");

  const transporter = getTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      console.log(`✅ Password reset email delivered via SMTP to ${to}`);
      return { success: true, delivered: true };
    } catch (err) {
      console.error(`❌ SMTP delivery failed to ${to}:`, err);
      return { success: true, delivered: false, error: (err as any)?.message };
    }
  } else {
    console.log("ℹ️ SMTP credentials not configured in .env; logged to console for testing.");
    return { success: true, delivered: false, note: "Logged to server console" };
  }
}
