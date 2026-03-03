/**
 * Event-Driven Architecture - Event Types
 *
 * Defines all system events, their payloads, and notification categories.
 * This is the single source of truth for all events in the LMS platform.
 */

// ============================================================================
// Notification Categories & Channels
// ============================================================================

export enum NotificationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  PUSH = "PUSH", // Future: mobile push notifications
}

export enum NotificationCategory {
  COURSE = "COURSE",
  LIVE_SESSION = "LIVE_SESSION",
  ASSIGNMENT = "ASSIGNMENT",
  QUIZ = "QUIZ",
  ANNOUNCEMENT = "ANNOUNCEMENT",
  CERTIFICATE = "CERTIFICATE",
  PAYMENT = "PAYMENT",
  SYSTEM = "SYSTEM",
  DISCUSSION = "DISCUSSION",
  GRADE = "GRADE",
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// ============================================================================
// Event Names (strongly typed)
// ============================================================================

export enum EventName {
  // Course Events
  COURSE_PUBLISHED = "course.published",
  COURSE_UPDATED = "course.updated",
  COURSE_ENROLLED = "course.enrolled",
  COURSE_COMPLETED = "course.completed",
  COURSE_CHAPTER_ADDED = "course.chapter.added",

  // Live Session Events
  LIVE_SESSION_STARTED = "live.session.started",
  LIVE_SESSION_ENDED = "live.session.ended",
  LIVE_SESSION_SCHEDULED = "live.session.scheduled",
  LIVE_SESSION_REMINDER = "live.session.reminder",
  LIVE_CHAT_MESSAGE = "live.chat.message",
  LIVE_POLL_CREATED = "live.poll.created",
  LIVE_POLL_ENDED = "live.poll.ended",

  // Assignment Events
  ASSIGNMENT_CREATED = "assignment.created",
  ASSIGNMENT_SUBMITTED = "assignment.submitted",
  ASSIGNMENT_GRADED = "assignment.graded",
  ASSIGNMENT_DUE_REMINDER = "assignment.due.reminder",

  // Quiz Events
  QUIZ_PUBLISHED = "quiz.published",
  QUIZ_COMPLETED = "quiz.completed",
  QUIZ_GRADED = "quiz.graded",

  // Announcement Events
  ANNOUNCEMENT_CREATED = "announcement.created",
  GLOBAL_ANNOUNCEMENT_CREATED = "announcement.global.created",

  // Certificate Events
  CERTIFICATE_ISSUED = "certificate.issued",

  // Payment Events
  PAYMENT_COMPLETED = "payment.completed",
  PAYMENT_FAILED = "payment.failed",

  // Discussion Events
  DISCUSSION_REPLY = "discussion.reply",
  DISCUSSION_MENTION = "discussion.mention",

  // System Events
  SYSTEM_MAINTENANCE = "system.maintenance",
  USER_WELCOME = "user.welcome",
  PASSWORD_CHANGED = "user.password.changed",

  // Final Exam Events
  FINAL_EXAM_AVAILABLE = "final.exam.available",
  FINAL_EXAM_SUBMITTED = "final.exam.submitted",
  FINAL_EXAM_GRADED = "final.exam.graded",
}

// ============================================================================
// Event Payloads
// ============================================================================

export interface BaseEventPayload {
  timestamp: Date;
  triggeredBy: string; // userId who triggered the event
}

// Course Events
export interface CoursePublishedPayload extends BaseEventPayload {
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  categoryId?: string;
}

export interface CourseUpdatedPayload extends BaseEventPayload {
  courseId: string;
  courseTitle: string;
  changes: string[];
}

export interface CourseEnrolledPayload extends BaseEventPayload {
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  teacherId: string;
}

export interface CourseCompletedPayload extends BaseEventPayload {
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  completionPercentage: number;
}

export interface CourseChapterAddedPayload extends BaseEventPayload {
  courseId: string;
  courseTitle: string;
  chapterId: string;
  chapterTitle: string;
}

// Live Session Events
export interface LiveSessionStartedPayload extends BaseEventPayload {
  sessionId: string;
  sessionTitle: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  streamUrl?: string;
}

export interface LiveSessionEndedPayload extends BaseEventPayload {
  sessionId: string;
  sessionTitle: string;
  courseId: string;
  duration: number; // minutes
  viewCount: number;
}

export interface LiveSessionScheduledPayload extends BaseEventPayload {
  sessionId: string;
  sessionTitle: string;
  courseId: string;
  courseTitle: string;
  scheduledAt: Date;
  teacherName: string;
}

export interface LiveSessionReminderPayload extends BaseEventPayload {
  sessionId: string;
  sessionTitle: string;
  courseId: string;
  courseTitle: string;
  startsIn: number; // minutes until start
}

export interface LiveChatMessagePayload extends BaseEventPayload {
  sessionId: string;
  userId: string;
  userName: string;
  message: string;
  isFromTeacher: boolean;
}

export interface LivePollCreatedPayload extends BaseEventPayload {
  sessionId: string;
  pollId: string;
  question: string;
  options: string[];
}

export interface LivePollEndedPayload extends BaseEventPayload {
  sessionId: string;
  pollId: string;
  question: string;
  results: Record<string, number>;
}

// Assignment Events
export interface AssignmentCreatedPayload extends BaseEventPayload {
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  dueDate?: Date;
}

export interface AssignmentSubmittedPayload extends BaseEventPayload {
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  studentId: string;
  studentName: string;
  teacherId: string;
}

export interface AssignmentGradedPayload extends BaseEventPayload {
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  studentId: string;
  grade: number;
  maxGrade: number;
  feedback?: string;
}

export interface AssignmentDueReminderPayload extends BaseEventPayload {
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  dueDate: Date;
  hoursUntilDue: number;
}

// Quiz Events
export interface QuizPublishedPayload extends BaseEventPayload {
  quizId: string;
  quizTitle: string;
  chapterId: string;
  courseId: string;
  courseTitle: string;
}

export interface QuizCompletedPayload extends BaseEventPayload {
  quizId: string;
  quizTitle: string;
  studentId: string;
  score: number;
  maxScore: number;
}

export interface QuizGradedPayload extends BaseEventPayload {
  quizId: string;
  quizTitle: string;
  studentId: string;
  score: number;
  maxScore: number;
}

// Announcement Events
export interface AnnouncementCreatedPayload extends BaseEventPayload {
  announcementId: string;
  courseId: string;
  courseTitle: string;
  content: string;
  teacherName: string;
}

export interface GlobalAnnouncementCreatedPayload extends BaseEventPayload {
  announcementId: string;
  title: string;
  content: string;
}

// Certificate Events
export interface CertificateIssuedPayload extends BaseEventPayload {
  certificateId: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  grade?: string;
  percentage: number;
}

// Payment Events
export interface PaymentCompletedPayload extends BaseEventPayload {
  purchaseId: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  amount: number;
  teacherId: string;
}

export interface PaymentFailedPayload extends BaseEventPayload {
  courseId: string;
  courseTitle: string;
  studentId: string;
  reason?: string;
}

// Discussion Events
export interface DiscussionReplyPayload extends BaseEventPayload {
  discussionId: string;
  courseId: string;
  courseTitle: string;
  replyContent: string;
  replierName: string;
  originalAuthorId: string;
}

export interface DiscussionMentionPayload extends BaseEventPayload {
  discussionId: string;
  courseId: string;
  mentionedUserId: string;
  mentionerName: string;
  content: string;
}

// System Events
export interface SystemMaintenancePayload extends BaseEventPayload {
  message: string;
  scheduledAt?: Date;
  estimatedDuration?: number; // minutes
}

export interface UserWelcomePayload extends BaseEventPayload {
  userId: string;
  userName: string;
  email: string;
}

export interface PasswordChangedPayload extends BaseEventPayload {
  userId: string;
  email: string;
}

// Final Exam Events
export interface FinalExamAvailablePayload extends BaseEventPayload {
  courseId: string;
  courseTitle: string;
}

export interface FinalExamSubmittedPayload extends BaseEventPayload {
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  teacherId: string;
}

export interface FinalExamGradedPayload extends BaseEventPayload {
  courseId: string;
  courseTitle: string;
  studentId: string;
  score: number;
  maxScore: number;
  passed: boolean;
}

// ============================================================================
// Event Map - Maps event names to their payload types
// ============================================================================

export interface EventMap {
  [EventName.COURSE_PUBLISHED]: CoursePublishedPayload;
  [EventName.COURSE_UPDATED]: CourseUpdatedPayload;
  [EventName.COURSE_ENROLLED]: CourseEnrolledPayload;
  [EventName.COURSE_COMPLETED]: CourseCompletedPayload;
  [EventName.COURSE_CHAPTER_ADDED]: CourseChapterAddedPayload;

  [EventName.LIVE_SESSION_STARTED]: LiveSessionStartedPayload;
  [EventName.LIVE_SESSION_ENDED]: LiveSessionEndedPayload;
  [EventName.LIVE_SESSION_SCHEDULED]: LiveSessionScheduledPayload;
  [EventName.LIVE_SESSION_REMINDER]: LiveSessionReminderPayload;
  [EventName.LIVE_CHAT_MESSAGE]: LiveChatMessagePayload;
  [EventName.LIVE_POLL_CREATED]: LivePollCreatedPayload;
  [EventName.LIVE_POLL_ENDED]: LivePollEndedPayload;

  [EventName.ASSIGNMENT_CREATED]: AssignmentCreatedPayload;
  [EventName.ASSIGNMENT_SUBMITTED]: AssignmentSubmittedPayload;
  [EventName.ASSIGNMENT_GRADED]: AssignmentGradedPayload;
  [EventName.ASSIGNMENT_DUE_REMINDER]: AssignmentDueReminderPayload;

  [EventName.QUIZ_PUBLISHED]: QuizPublishedPayload;
  [EventName.QUIZ_COMPLETED]: QuizCompletedPayload;
  [EventName.QUIZ_GRADED]: QuizGradedPayload;

  [EventName.ANNOUNCEMENT_CREATED]: AnnouncementCreatedPayload;
  [EventName.GLOBAL_ANNOUNCEMENT_CREATED]: GlobalAnnouncementCreatedPayload;

  [EventName.CERTIFICATE_ISSUED]: CertificateIssuedPayload;

  [EventName.PAYMENT_COMPLETED]: PaymentCompletedPayload;
  [EventName.PAYMENT_FAILED]: PaymentFailedPayload;

  [EventName.DISCUSSION_REPLY]: DiscussionReplyPayload;
  [EventName.DISCUSSION_MENTION]: DiscussionMentionPayload;

  [EventName.SYSTEM_MAINTENANCE]: SystemMaintenancePayload;
  [EventName.USER_WELCOME]: UserWelcomePayload;
  [EventName.PASSWORD_CHANGED]: PasswordChangedPayload;

  [EventName.FINAL_EXAM_AVAILABLE]: FinalExamAvailablePayload;
  [EventName.FINAL_EXAM_SUBMITTED]: FinalExamSubmittedPayload;
  [EventName.FINAL_EXAM_GRADED]: FinalExamGradedPayload;
}

// ============================================================================
// Notification Template Data
// ============================================================================

export interface NotificationTemplate {
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  actionUrl?: string;
}

// ============================================================================
// SSE Connection Types
// ============================================================================

export interface SSEClient {
  id: string;
  userId: string;
  controller: ReadableStreamDefaultController;
  lastHeartbeat: number;
}
