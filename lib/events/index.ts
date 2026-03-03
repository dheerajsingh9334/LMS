/**
 * Events Module - Public API
 *
 * Re-exports everything needed for event-driven architecture.
 * Import from '@/lib/events' for clean imports.
 */

export { eventBus, EventBus } from "./event-bus";
export { sseManager, SSEManager } from "./sse-manager";
export { registerNotificationHandlers } from "./notification-service";
export {
  sendNotificationEmail,
  sendBulkNotificationEmails,
  emailTemplates,
  emailQueue,
} from "./email-service";
export {
  EventName,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  type EventMap,
  type BaseEventPayload,
  type SSEClient,
  type NotificationTemplate,
  // Course Events
  type CoursePublishedPayload,
  type CourseEnrolledPayload,
  type CourseCompletedPayload,
  type CourseChapterAddedPayload,
  // Live Session Events
  type LiveSessionStartedPayload,
  type LiveSessionEndedPayload,
  type LiveSessionScheduledPayload,
  type LiveSessionReminderPayload,
  type LiveChatMessagePayload,
  type LivePollCreatedPayload,
  // Assignment Events
  type AssignmentCreatedPayload,
  type AssignmentSubmittedPayload,
  type AssignmentGradedPayload,
  type AssignmentDueReminderPayload,
  // Quiz Events
  type QuizPublishedPayload,
  type QuizCompletedPayload,
  // Announcement Events
  type AnnouncementCreatedPayload,
  type GlobalAnnouncementCreatedPayload,
  // Certificate Events
  type CertificateIssuedPayload,
  // Payment Events
  type PaymentCompletedPayload,
  type PaymentFailedPayload,
  // Discussion Events
  type DiscussionReplyPayload,
  type DiscussionMentionPayload,
  // System Events
  type SystemMaintenancePayload,
  type UserWelcomePayload,
  type PasswordChangedPayload,
  // Final Exam Events
  type FinalExamAvailablePayload,
  type FinalExamSubmittedPayload,
  type FinalExamGradedPayload,
} from "./types";
