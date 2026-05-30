import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function getFromAddress(): string {
  const email =
    process.env.RESEND_FROM_EMAIL ||
    process.env.RESEND_SENDER_EMAIL ||
    'onboarding@resend.dev';
  const name = process.env.RESEND_FROM_NAME || process.env.RESEND_SENDER_NAME || 'Projects.AI';
  return `${name} <${email}>`;
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  label: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log(`[Mock Email] ${params.label}:`, params.to, params.subject);
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: getFromAddress(),
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) {
      console.error(`[Resend] Error sending ${params.label}:`, error);
      console.warn('[Resend] Continuing without email notification');
      return;
    }

    console.log(`[Resend] ${params.label} sent to ${params.to}`);
  } catch (error) {
    console.error(`[Resend] Error sending ${params.label}:`, error);
    console.warn('[Resend] Continuing without email notification');
  }
}

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set. In-app email notifications will be disabled.');
}

export interface TaskAssignmentEmailParams {
  to: string;
  toName: string;
  taskTitle: string;
  taskDescription: string;
  dueDate: string;
  assignerName: string;
  assignerEmail?: string;
  priority?: string;
  status?: string;
  taskId?: string;
}

export async function sendTaskAssignmentEmail(params: TaskAssignmentEmailParams): Promise<void> {
  const dashboardUrl = `${appUrl()}/dashboard`;
  await sendEmail({
    label: 'task assignment email',
    to: params.to,
    subject: `New Task Assigned: ${params.taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8B5CF6 0%, #20B2AA 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1>Projects.AI</h1>
              <p>You have been assigned a new task</p>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Hello ${params.toName},</p>
              <p><strong>${params.assignerName}</strong> has assigned you a new task:</p>
              <div style="background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #8B5CF6; border-radius: 4px;">
                <h2>${params.taskTitle}</h2>
                <p>${params.taskDescription || 'No description provided.'}</p>
                <p><strong>Due Date:</strong> ${params.dueDate}</p>
                ${params.priority ? `<p><strong>Priority:</strong> ${params.priority}</p>` : ''}
                ${params.status ? `<p><strong>Status:</strong> ${params.status}</p>` : ''}
                <p><strong>Assigned by:</strong> ${params.assignerName}${params.assignerEmail ? ` (${params.assignerEmail})` : ''}</p>
              </div>
              <p>Please log in to your Projects.AI dashboard to view and manage this task.</p>
              <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px;">View Task</a>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hello ${params.toName},\n\n${params.assignerName} has assigned you a new task:\n\nTitle: ${params.taskTitle}\nDescription: ${params.taskDescription || 'No description provided.'}\nDue Date: ${params.dueDate}\n\nView in dashboard: ${dashboardUrl}`,
  });
}

export interface TaskProgressEmailParams {
  to: string;
  toName: string;
  taskTitle: string;
  taskDescription: string;
  assigneeName: string;
  status: string;
  progressUpdate: string;
}

export async function sendTaskProgressEmail(params: TaskProgressEmailParams): Promise<void> {
  const dashboardUrl = `${appUrl()}/dashboard`;
  await sendEmail({
    label: 'task progress email',
    to: params.to,
    subject: `Task Progress Update: ${params.taskTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8B5CF6 0%, #20B2AA 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1>Projects.AI</h1>
              <p>Task Progress Update</p>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Hello ${params.toName},</p>
              <p><strong>${params.assigneeName}</strong> has updated the status of task:</p>
              <div style="background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #8B5CF6; border-radius: 4px;">
                <h2>${params.taskTitle}</h2>
                <p>${params.taskDescription || 'No description provided.'}</p>
                <p><strong>New Status:</strong> ${params.status}</p>
                <p><strong>Update:</strong> ${params.progressUpdate}</p>
              </div>
              <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px;">View Task</a>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export interface InviteEmailParams {
  to: string;
  role: string;
  inviteLink: string;
  organizationName: string;
  inviterName: string;
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<void> {
  await sendEmail({
    label: 'invite email',
    to: params.to,
    subject: `You've been invited to join ${params.organizationName} on Projects.AI`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8B5CF6 0%, #20B2AA 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1>You're Invited!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Hello,</p>
              <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.organizationName}</strong> on Projects.AI as a <strong>${params.role}</strong>.</p>
              <p>Click the button below to accept the invitation and create your account:</p>
              <a href="${params.inviteLink}" style="display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px;">Accept Invitation</a>
              <p style="margin-top: 20px; font-size: 12px; color: #666;">This invitation link will expire in 7 days.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendWelcomeEmail(
  to: string,
  toName: string,
  organizationName: string
): Promise<void> {
  const dashboardUrl = `${appUrl()}/dashboard`;
  await sendEmail({
    label: 'welcome email',
    to,
    subject: `Welcome to ${organizationName} on Projects.AI`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #8B5CF6 0%, #20B2AA 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1>Welcome to Projects.AI!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px;">
              <p>Hello ${toName},</p>
              <p>You have been added to <strong>${organizationName}</strong> on Projects.AI.</p>
              <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px;">Go to Dashboard</a>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
