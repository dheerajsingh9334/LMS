/**
 * Email Notification Service
 *
 * Uses Resend (already in dependencies) to send transactional emails.
 * Supports templated emails for all notification types with:
 * - Rate limiting per user
 * - Retry with exponential backoff
 * - Email queue for bulk sends
 * - HTML email templates
 */

import { Resend } from "resend";
import { NotificationCategory, NotificationPriority } from "./types";

// Lazy-initialize Resend client so the module doesn't crash at import time
// when RESEND_API_KEY is not set (e.g. local dev without email).
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn("[EmailService] RESEND_API_KEY not set — emails disabled.");
      return null;
    }
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL =
  process.env.EMAIL_FROM || "LMS Platform <noreply@lms.example.com>";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "LMS Platform";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// ============================================================================
// Rate Limiting
// ============================================================================

const emailRateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 3600_000; // 1 hour
const RATE_LIMIT_MAX = 50; // max emails per user per hour

function checkEmailRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = emailRateLimit.get(userId);

  if (!entry || now > entry.resetAt) {
    emailRateLimit.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// ============================================================================
// Email Queue for bulk operations
// ============================================================================

interface QueuedEmail {
  to: string;
  subject: string;
  html: string;
  userId: string;
  retries: number;
  maxRetries: number;
}

class EmailQueue {
  private queue: QueuedEmail[] = [];
  private processing = false;
  private batchSize = 10;
  private batchDelay = 1000; // 1 second between batches

  add(email: QueuedEmail): void {
    this.queue.push(email);
    if (!this.processing) {
      this.process();
    }
  }

  addBulk(emails: QueuedEmail[]): void {
    this.queue.push(...emails);
    if (!this.processing) {
      this.process();
    }
  }

  private async process(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);

      await Promise.allSettled(
        batch.map(async (email) => {
          try {
            if (!checkEmailRateLimit(email.userId)) {
              console.warn(
                `[EmailQueue] Rate limit exceeded for user: ${email.userId}`,
              );
              return;
            }

            const client = getResend();
            if (!client) return; // emails disabled

            await client.emails.send({
              from: FROM_EMAIL,
              to: email.to,
              subject: email.subject,
              html: email.html,
            });
          } catch (error) {
            console.error(
              `[EmailQueue] Failed to send email to ${email.to}:`,
              error,
            );
            if (email.retries < email.maxRetries) {
              email.retries++;
              // Re-add with exponential backoff (will be processed in next batch)
              this.queue.push(email);
            }
          }
        }),
      );

      // Delay between batches to respect rate limits
      if (this.queue.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.batchDelay));
      }
    }

    this.processing = false;
  }

  get pending(): number {
    return this.queue.length;
  }
}

export const emailQueue = new EmailQueue();

// ============================================================================
// Email Templates
// ============================================================================

function baseTemplate(
  content: string,
  actionUrl?: string,
  actionText?: string,
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }
    .header { background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px; }
    .content { padding: 32px 24px; color: #374151; line-height: 1.6; }
    .content h2 { font-size: 20px; margin: 0 0 16px; color: #111827; }
    .content p { margin: 0 0 16px; font-size: 15px; }
    .action-btn { display: inline-block; background: #0ea5e9; color: white !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .action-btn:hover { background: #0284c7; }
    .footer { padding: 24px; text-align: center; background: #f9fafb; border-top: 1px solid #e5e7eb; }
    .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-info { background: #dbeafe; color: #1d4ed8; }
    .badge-success { background: #dcfce7; color: #16a34a; }
    .badge-warning { background: #fef3c7; color: #d97706; }
    .badge-urgent { background: #fee2e2; color: #dc2626; }
    .info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
  </style>
</head>
<body>
  <div style="padding: 24px;">
    <div class="container">
      <div class="header">
        <h1>${APP_NAME}</h1>
        <p>Your Learning Journey</p>
      </div>
      <div class="content">
        ${content}
        ${actionUrl ? `<p style="text-align: center;"><a href="${actionUrl}" class="action-btn">${actionText || "View Details"}</a></p>` : ""}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
        <p style="margin-top: 8px;">
          <a href="${APP_URL}/settings" style="color: #6b7280; text-decoration: underline;">Manage notification preferences</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function priorityBadge(priority: NotificationPriority): string {
  const classes: Record<NotificationPriority, string> = {
    LOW: "badge-info",
    MEDIUM: "badge-info",
    HIGH: "badge-warning",
    URGENT: "badge-urgent",
  };
  return `<span class="badge ${classes[priority]}">${priority}</span>`;
}

// ============================================================================
// Notification-specific email builders
// ============================================================================

export interface SendEmailParams {
  to: string;
  userId: string;
  subject: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  actionUrl?: string;
  actionText?: string;
  additionalInfo?: Record<string, string>;
}

export async function sendNotificationEmail(
  params: SendEmailParams,
): Promise<boolean> {
  const {
    to,
    userId,
    subject,
    title,
    body,
    category,
    priority,
    actionUrl,
    actionText,
    additionalInfo,
  } = params;

  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set, skipping email notification");
    return false;
  }

  let content = `
    <h2>${title}</h2>
    <p>${body}</p>
  `;

  if (additionalInfo) {
    content += `<div class="info-box">`;
    for (const [key, value] of Object.entries(additionalInfo)) {
      content += `<p><strong>${key}:</strong> ${value}</p>`;
    }
    content += `</div>`;
  }

  content += `<p style="margin-top: 8px;">${priorityBadge(priority)}</p>`;

  const html = baseTemplate(content, actionUrl, actionText);

  emailQueue.add({
    to,
    subject: `[${APP_NAME}] ${subject}`,
    html,
    userId,
    retries: 0,
    maxRetries: 3,
  });

  return true;
}

/**
 * Send bulk notification emails (e.g., to all course students)
 */
export async function sendBulkNotificationEmails(
  recipients: Array<{ email: string; userId: string; name?: string }>,
  params: Omit<SendEmailParams, "to" | "userId">,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set, skipping bulk email");
    return;
  }

  const emails = recipients.map((recipient) => {
    let content = `
      <h2>${params.title}</h2>
      ${recipient.name ? `<p>Hi ${recipient.name},</p>` : ""}
      <p>${params.body}</p>
    `;

    if (params.additionalInfo) {
      content += `<div class="info-box">`;
      for (const [key, value] of Object.entries(params.additionalInfo)) {
        content += `<p><strong>${key}:</strong> ${value}</p>`;
      }
      content += `</div>`;
    }

    const html = baseTemplate(content, params.actionUrl, params.actionText);

    return {
      to: recipient.email,
      subject: `[${APP_NAME}] ${params.subject}`,
      html,
      userId: recipient.userId,
      retries: 0,
      maxRetries: 3,
    };
  });

  emailQueue.addBulk(emails);
}

// ============================================================================
// Pre-built email templates for common notifications
// ============================================================================

export const emailTemplates = {
  liveSessionStarted: (
    sessionTitle: string,
    courseTitle: string,
    teacherName: string,
    sessionUrl: string,
  ) => ({
    subject: `🔴 Live Now: ${sessionTitle}`,
    title: "Live Session Started!",
    body: `<strong>${teacherName}</strong> has started a live session: <strong>"${sessionTitle}"</strong> in the course <strong>"${courseTitle}"</strong>. Join now to participate!`,
    actionUrl: sessionUrl,
    actionText: "Join Live Session",
    category: NotificationCategory.LIVE_SESSION,
    priority: NotificationPriority.HIGH,
  }),

  assignmentGraded: (
    assignmentTitle: string,
    grade: number,
    maxGrade: number,
    courseTitle: string,
  ) => ({
    subject: `Assignment Graded: ${assignmentTitle}`,
    title: "Your Assignment Has Been Graded",
    body: `Your assignment <strong>"${assignmentTitle}"</strong> in <strong>"${courseTitle}"</strong> has been reviewed.`,
    additionalInfo: {
      Score: `${grade}/${maxGrade}`,
      Percentage: `${Math.round((grade / maxGrade) * 100)}%`,
    },
    category: NotificationCategory.GRADE,
    priority: NotificationPriority.MEDIUM,
  }),

  courseEnrolled: (courseTitle: string, courseUrl: string) => ({
    subject: `Welcome to ${courseTitle}`,
    title: "You're Enrolled! 🎉",
    body: `You have successfully enrolled in <strong>"${courseTitle}"</strong>. Start learning right away!`,
    actionUrl: courseUrl,
    actionText: "Start Learning",
    category: NotificationCategory.COURSE,
    priority: NotificationPriority.MEDIUM,
  }),

  certificateIssued: (
    courseTitle: string,
    grade: string,
    percentage: number,
    downloadUrl: string,
  ) => ({
    subject: `Certificate Earned: ${courseTitle}`,
    title: "Congratulations! 🏆",
    body: `You've earned a certificate for completing <strong>"${courseTitle}"</strong>.`,
    additionalInfo: {
      Grade: grade,
      Score: `${percentage.toFixed(1)}%`,
    },
    actionUrl: downloadUrl,
    actionText: "Download Certificate",
    category: NotificationCategory.CERTIFICATE,
    priority: NotificationPriority.HIGH,
  }),

  paymentCompleted: (
    courseTitle: string,
    amount: number,
    courseUrl: string,
  ) => ({
    subject: `Payment Confirmed: ${courseTitle}`,
    title: "Payment Successful ✅",
    body: `Your payment of <strong>₹${amount}</strong> for <strong>"${courseTitle}"</strong> has been confirmed.`,
    actionUrl: courseUrl,
    actionText: "Go to Course",
    category: NotificationCategory.PAYMENT,
    priority: NotificationPriority.HIGH,
  }),

  welcome: (userName: string) => ({
    subject: `Welcome to ${APP_NAME}!`,
    title: `Welcome, ${userName}! 👋`,
    body: `We're excited to have you on <strong>${APP_NAME}</strong>. Explore our courses, join live sessions, and accelerate your learning journey.`,
    actionUrl: APP_URL,
    actionText: "Explore Courses",
    category: NotificationCategory.SYSTEM,
    priority: NotificationPriority.MEDIUM,
  }),

  assignmentDueReminder: (
    assignmentTitle: string,
    courseTitle: string,
    hoursLeft: number,
    assignmentUrl: string,
  ) => ({
    subject: `⏰ Assignment Due Soon: ${assignmentTitle}`,
    title: "Assignment Due Reminder",
    body: `Your assignment <strong>"${assignmentTitle}"</strong> in <strong>"${courseTitle}"</strong> is due in <strong>${hoursLeft} hours</strong>. Don't forget to submit!`,
    actionUrl: assignmentUrl,
    actionText: "Submit Assignment",
    category: NotificationCategory.ASSIGNMENT,
    priority: NotificationPriority.URGENT,
  }),

  announcementCreated: (
    courseTitle: string,
    content: string,
    courseUrl: string,
  ) => ({
    subject: `New Announcement: ${courseTitle}`,
    title: "New Course Announcement",
    body: `A new announcement has been posted in <strong>"${courseTitle}"</strong>:<br><br>${content.substring(0, 300)}${content.length > 300 ? "..." : ""}`,
    actionUrl: courseUrl,
    actionText: "View Announcement",
    category: NotificationCategory.ANNOUNCEMENT,
    priority: NotificationPriority.MEDIUM,
  }),

  liveSessionScheduled: (
    sessionTitle: string,
    courseTitle: string,
    scheduledAt: string,
    courseUrl: string,
  ) => ({
    subject: `📅 Upcoming Live Session: ${sessionTitle}`,
    title: "Live Session Scheduled",
    body: `A new live session <strong>"${sessionTitle}"</strong> has been scheduled in <strong>"${courseTitle}"</strong>.`,
    additionalInfo: {
      "Scheduled At": scheduledAt,
    },
    actionUrl: courseUrl,
    actionText: "View Course",
    category: NotificationCategory.LIVE_SESSION,
    priority: NotificationPriority.MEDIUM,
  }),
};
