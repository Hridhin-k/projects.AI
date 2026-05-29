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

export async function sendTaskAssignmentEmail(
  params: TaskAssignmentEmailParams
): Promise<void> {
  if (!apiInstance) {
    console.log('[Mock Email] Task assignment:', params);
    return;
  }

  try {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.BREVO_FROM_EMAIL || 'noreply@Projects.AI';
    const senderName = process.env.BREVO_SENDER_NAME || 'Projects.AI';

    const sendSmtpEmail: SendSmtpEmail = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: params.to, name: params.toName }],
      subject: `New Task Assigned: ${params.taskTitle}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8B5CF6 0%, #20B2AA 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
              .task-card { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #8B5CF6; border-radius: 4px; }
              .button { display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Projects.AI</h1>
                <p>You have been assigned a new task</p>
              </div>
              <div class="content">
                <p>Hello ${params.toName},</p>
                <p><strong>${params.assignerName}</strong> has assigned you a new task:</p>
                <div class="task-card">
                  <h2>${params.taskTitle}</h2>
                  <p>${params.taskDescription || 'No description provided.'}</p>
                  <p><strong>Due Date:</strong> ${params.dueDate}</p>
                  ${params.priority ? `<p><strong>Priority:</strong> ${params.priority}</p>` : ''}
                  ${params.status ? `<p><strong>Status:</strong> ${params.status}</p>` : ''}
                  <p><strong>Assigned by:</strong> ${params.assignerName}${params.assignerEmail ? ` (${params.assignerEmail})` : ''}</p>
                </div>
                <p>Please log in to your Projects.AI dashboard to view and manage this task.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">View Task</a>
              </div>
            </div>
          </body>
        </html>
      `,
      textContent: `
        Hello ${params.toName},
        
        ${params.assignerName} has assigned you a new task:
        
        Title: ${params.taskTitle}
        Description: ${params.taskDescription || 'No description provided.'}
        Due Date: ${params.dueDate}
        
        Please log in to your Projects.AI dashboard to view and manage this task.
      `,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Brevo] Task assignment email sent to ${params.to}`);
  } catch (error: any) {
    console.error('[Brevo] Error sending email:', error);
    if (error.response) {
      console.error('[Brevo] Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('[Brevo] Response status:', error.response.status);
    }
    // Don't throw - allow the app to continue even if email fails
    console.warn('[Brevo] Continuing without email notification');
  }
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

export async function sendTaskProgressEmail(
  params: TaskProgressEmailParams
): Promise<void> {
  if (!apiInstance) {
    console.log('[Mock Email] Task progress update:', params);
    return;
  }

  try {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.BREVO_FROM_EMAIL || 'noreply@Projects.AI';
    const senderName = process.env.BREVO_SENDER_NAME || 'Projects.AI';

    const sendSmtpEmail: SendSmtpEmail = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: params.to, name: params.toName }],
      subject: `Task Progress Update: ${params.taskTitle}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8B5CF6 0%, #20B2AA 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
              .task-card { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #8B5CF6; border-radius: 4px; }
              .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
              .status-in-progress { background: #8B5CF6; color: white; }
              .status-done { background: #20B2AA; color: white; }
              .status-blocked { background: #ef4444; color: white; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Projects.AI</h1>
                <p>Task Progress Update</p>
              </div>
              <div class="content">
                <p>Hello ${params.toName},</p>
                <p><strong>${params.assigneeName}</strong> has updated the status of task:</p>
                <div class="task-card">
                  <h2>${params.taskTitle}</h2>
                  <p>${params.taskDescription || 'No description provided.'}</p>
                  <p><strong>New Status:</strong> <span class="status-badge status-${params.status.toLowerCase().replace('_', '-')}">${params.status}</span></p>
                  <p><strong>Update:</strong> ${params.progressUpdate}</p>
                </div>
                <p>Please log in to your Projects.AI dashboard to view the updated task.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px;">View Task</a>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Brevo] Task progress email sent to ${params.to}`);
  } catch (error: any) {
    console.error('[Brevo] Error sending progress email:', error);
    if (error.response) {
      console.error('[Brevo] Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('[Brevo] Response status:', error.response.status);
    }
    // Don't throw - allow the app to continue even if email fails
    console.warn('[Brevo] Continuing without email notification');
  }
}

export interface InviteEmailParams {
  to: string;
  role: string;
  inviteLink: string;
  organizationName: string;
  inviterName: string;
}

export async function sendInviteEmail(
  params: InviteEmailParams
): Promise<void> {
  if (!apiInstance) {
    console.log('[Mock Email] Invite email:', params);
    return;
  }

  try {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.BREVO_FROM_EMAIL || 'noreply@Projects.AI';
    const senderName = process.env.BREVO_SENDER_NAME || 'Projects.AI';

    const sendSmtpEmail: SendSmtpEmail = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: params.to, name: params.to }],
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
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>You're Invited!</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.organizationName}</strong> on Projects.AI as a <strong>${params.role}</strong>.</p>
                <p>Projects.AI is an AI-powered task management system that helps teams stay organized and productive.</p>
                <p>Click the button below to accept the invitation and create your account:</p>
                <a href="${params.inviteLink}" class="button">Accept Invitation</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">This invitation link will expire in 7 days.</p>
                <p style="font-size: 12px; color: #666;">If you didn't expect this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Brevo] Invite email sent to ${params.to}`);
  } catch (error: any) {
    console.error('[Brevo] Error sending invite email:', error);
    if (error.response) {
      console.error('[Brevo] Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('[Brevo] Response status:', error.response.status);
    }
    // Don't throw - allow the app to continue even if email fails
    console.warn('[Brevo] Continuing without email notification');
  }
}

export async function sendWelcomeEmail(
  to: string,
  toName: string,
  organizationName: string
): Promise<void> {
  if (!apiInstance) {
    console.log('[Mock Email] Welcome email:', { to, toName, organizationName });
    return;
  }

  try {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.BREVO_FROM_EMAIL || 'noreply@Projects.AI';
    const senderName = process.env.BREVO_SENDER_NAME || 'Projects.AI';

    const sendSmtpEmail: SendSmtpEmail = {
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to, name: toName }],
      subject: `Welcome to ${organizationName} on Projects.AI`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8B5CF6 0%, #20B2AA 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Projects.AI!</h1>
              </div>
              <div class="content">
                <p>Hello ${toName},</p>
                <p>You have been added to <strong>${organizationName}</strong> on Projects.AI.</p>
                <p>Projects.AI is an AI-powered task management system that helps teams stay organized and productive.</p>
                <p>Get started by logging in to your dashboard and exploring your tasks.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px;">Go to Dashboard</a>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Brevo] Welcome email sent to ${to}`);
  } catch (error: any) {
    console.error('[Brevo] Error sending welcome email:', error);
    if (error.response) {
      console.error('[Brevo] Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('[Brevo] Response status:', error.response.status);
    }
    // Don't throw - allow the app to continue even if email fails
    console.warn('[Brevo] Continuing without email notification');
  }
}

