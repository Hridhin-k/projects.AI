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

export interface TaskProgressEmailParams {
  to: string;
  toName: string;
  taskTitle: string;
  taskId: string;
  employeeName: string;
  employeeEmail: string;
  oldStatus: string;
  newStatus: string;
  completionPercentage?: number;
}

export async function sendTaskProgressEmail(params: TaskProgressEmailParams): Promise<void> {
  if (!apiInstance) {
    console.log('[Mock Email] Task progress notification:', params);
    return;
  }

  try {
    const statusMessages: Record<string, string> = {
      'TO_DO': 'Task has been created',
      'IN_PROGRESS': 'Task is now in progress',
      'DONE': 'Task has been completed! 🎉',
      'BLOCKED': 'Task has been blocked',
    };

    const statusMessage = statusMessages[params.newStatus] || 'Task status has been updated';
    const isCompleted = params.newStatus === 'DONE';

    const sendSmtpEmail: SendSmtpEmail = {
      to: [{ email: params.to, name: params.toName }],
      subject: `Task Update: ${params.taskTitle} - ${statusMessage}`,
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
              .status-${params.newStatus.toLowerCase().replace('_', '-')} { background: ${getStatusColor(params.newStatus)}; color: white; }
              .button { display: inline-block; padding: 12px 24px; background: #8B5CF6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${isCompleted ? '🎉 Task Completed!' : 'Task Update'}</h1>
                <p>${statusMessage}</p>
              </div>
              <div class="content">
                <p>Hello ${params.toName},</p>
                <p>The task you assigned has been updated:</p>
                <div class="task-card">
                  <h2>${params.taskTitle}</h2>
                  <p><strong>Assigned to:</strong> ${params.employeeName} (${params.employeeEmail})</p>
                  <p><strong>Previous Status:</strong> ${params.oldStatus}</p>
                  <p><strong>New Status:</strong> <span class="status-badge status-${params.newStatus.toLowerCase().replace('_', '-')}">${params.newStatus}</span></p>
                  ${params.completionPercentage !== undefined ? `<p><strong>Progress:</strong> ${params.completionPercentage}%</p>` : ''}
                </div>
                <p>You can view the task details in your Projects.AI dashboard.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">View Dashboard</a>
              </div>
            </div>
          </body>
        </html>
      `,
      textContent: `
        Hello ${params.toName},
        
        The task you assigned has been updated:
        
        Task: ${params.taskTitle}
        Assigned to: ${params.employeeName} (${params.employeeEmail})
        Previous Status: ${params.oldStatus}
        New Status: ${params.newStatus}
        ${params.completionPercentage !== undefined ? `Progress: ${params.completionPercentage}%` : ''}
        
        View in dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard
      `,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`[Brevo] Task progress email sent to ${params.to}`);
  } catch (error) {
    console.error('[Brevo] Error sending progress email:', error);
    throw error;
  }
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'TO_DO': '#6B7280',
    'IN_PROGRESS': '#8B5CF6',
    'DONE': '#20B2AA',
    'BLOCKED': '#EF4444',
  };
  return colors[status] || '#6B7280';
}

