import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

if (!process.env.BREVO_API_KEY) {
  console.warn('BREVO_API_KEY is not set. Email functionality will be disabled.');
}

const apiInstance = process.env.BREVO_API_KEY
  ? new TransactionalEmailsApi()
  : null;

if (apiInstance && process.env.BREVO_API_KEY) {
  apiInstance.setApiKey(0, process.env.BREVO_API_KEY);
}

export interface InviteEmailParams {
  to: string;
  toName: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  inviteLink: string;
  organizationName: string;
  invitedBy: string;
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<void> {
  if (!apiInstance) {
    console.log('[Mock Email] Invite email:', params);
    return;
  }

  try {
    const roleLabel = {
      ADMIN: 'Administrator',
      MANAGER: 'Manager',
      EMPLOYEE: 'Employee',
    }[params.role];

    const sendSmtpEmail: SendSmtpEmail = {
      to: [{ email: params.to, name: params.toName }],
      subject: `You've been invited to join ${params.organizationName} on Projects.AI`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8B5CF6 0%, #20B2AA 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
              .role-badge { display: inline-block; padding: 4px 12px; background: #8B5CF6; color: white; border-radius: 12px; font-size: 12px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Projects.AI</h1>
                <p>You've been invited!</p>
              </div>
              <div class="content">
                <p>Hello ${params.toName},</p>
                <p><strong>${params.invitedBy}</strong> has invited you to join <strong>${params.organizationName}</strong> on Projects.AI.</p>
                <p>Your role will be: <span class="role-badge">${roleLabel}</span></p>
                <p>Click the button below to accept the invitation and create your account:</p>
                <a href="${params.inviteLink}" class="button">Accept Invitation</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">
                  This invitation link will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                </p>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                  Or copy and paste this link: ${params.inviteLink}
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      textContent: `
        Hello ${params.toName},
        
        ${params.invitedBy} has invited you to join ${params.organizationName} on Projects.AI.
        Your role will be: ${roleLabel}
        
        Accept the invitation by visiting: ${params.inviteLink}
        
        This invitation link will expire in 7 days.
      `,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Brevo] Invite email sent to ${params.to}`);
  } catch (error) {
    console.error('[Brevo] Error sending invite email:', error);
    throw error;
  }
}

