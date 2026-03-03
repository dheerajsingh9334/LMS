/**
 * Notification Service - Core Event Handler
 *
 * Listens to all events via EventBus and:
 * 1. Creates in-app notifications in the database
 * 2. Sends real-time notifications via SSE
 * 3. Sends email notifications (respecting user preferences)
 * 4. Handles bulk notifications for course-wide events
 *
 * This is the central nervous system of the notification architecture.
 */

import { db } from "@/lib/db";
import { eventBus } from "./event-bus";
import { sseManager } from "./sse-manager";
import {
  sendNotificationEmail,
  sendBulkNotificationEmails,
  emailTemplates,
} from "./email-service";
import {
  EventName,
  NotificationCategory,
  NotificationChannel,
  NotificationPriority,
  NotificationTemplate,
} from "./types";

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// ============================================================================
// Helper: Get enrolled students for a course
// ============================================================================

async function getCourseStudents(courseId: string) {
  const purchases = await db.purchase.findMany({
    where: { courseId, paymentStatus: "completed" },
    select: { userId: true },
  });

  const userIds = purchases.map((p) => p.userId);
  if (userIds.length === 0) return [];

  return db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });
}

// ============================================================================
// Helper: Create in-app notification + SSE push
// ============================================================================

interface CreateNotificationParams {
  userId: string;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  actionUrl?: string;
  courseId?: string;
  metadata?: Record<string, any>;
}

async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await db.notificationV2.create({
      data: {
        userId: params.userId,
        title: params.title,
        body: params.body,
        category: params.category,
        priority: params.priority,
        actionUrl: params.actionUrl,
        courseId: params.courseId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      },
    });

    // Push via SSE in real-time
    sseManager.sendToUser(params.userId, {
      type: "notification",
      data: {
        id: notification.id,
        title: params.title,
        body: params.body,
        category: params.category,
        priority: params.priority,
        actionUrl: params.actionUrl,
        isRead: false,
        createdAt: notification.createdAt,
      },
    });

    return notification;
  } catch (error) {
    console.error(
      "[NotificationService] Failed to create notification:",
      error,
    );
    return null;
  }
}

/**
 * Create notifications for multiple users (bulk)
 */
async function createBulkNotifications(
  userIds: string[],
  template: Omit<CreateNotificationParams, "userId">,
) {
  const BATCH_SIZE = 100;

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map((userId) => createNotification({ ...template, userId })),
    );

    // Small delay between batches to prevent DB overload
    if (i + BATCH_SIZE < userIds.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

// ============================================================================
// Check user email preferences
// ============================================================================

async function shouldSendEmail(
  userId: string,
  category: NotificationCategory,
): Promise<boolean> {
  try {
    const prefs = await db.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) return true; // Default: send emails

    if (!prefs.emailEnabled) return false;

    // Check category-specific preferences
    const categoryPrefs = prefs.categoryPreferences
      ? ((typeof prefs.categoryPreferences === "string"
          ? JSON.parse(prefs.categoryPreferences)
          : prefs.categoryPreferences) as Record<string, boolean>)
      : {};

    return categoryPrefs[category] !== false; // Default true if not explicitly disabled
  } catch {
    return true; // Default: send emails on error
  }
}

// ============================================================================
// Event Handlers Registration
// ============================================================================

export function registerNotificationHandlers(): void {
  console.log("[NotificationService] Registering event handlers...");

  // ─── Course Events ────────────────────────────────────────────────────

  eventBus.on(EventName.COURSE_PUBLISHED, async (payload) => {
    // Notify all platform users? Or just subscribed ones?
    // For now, this is a low-traffic event — skip bulk notification.
    console.log(`[Event] Course published: ${payload.courseTitle}`);
  });

  eventBus.on(EventName.COURSE_ENROLLED, async (payload) => {
    // Notify the student
    await createNotification({
      userId: payload.studentId,
      title: "Course Enrolled Successfully!",
      body: `You have been enrolled in "${payload.courseTitle}". Start learning now!`,
      category: NotificationCategory.COURSE,
      priority: NotificationPriority.MEDIUM,
      actionUrl: `${APP_URL}/courses/${payload.courseId}`,
      courseId: payload.courseId,
    });

    // Notify the teacher
    await createNotification({
      userId: payload.teacherId,
      title: "New Student Enrolled",
      body: `${payload.studentName} has enrolled in your course "${payload.courseTitle}".`,
      category: NotificationCategory.COURSE,
      priority: NotificationPriority.LOW,
      courseId: payload.courseId,
    });

    // Send email to student
    const student = await db.user.findUnique({
      where: { id: payload.studentId },
      select: { email: true },
    });
    if (
      student?.email &&
      (await shouldSendEmail(payload.studentId, NotificationCategory.COURSE))
    ) {
      const template = emailTemplates.courseEnrolled(
        payload.courseTitle,
        `${APP_URL}/courses/${payload.courseId}`,
      );
      await sendNotificationEmail({
        to: student.email,
        userId: payload.studentId,
        subject: template.subject,
        title: template.title,
        body: template.body,
        category: template.category,
        priority: template.priority,
        actionUrl: template.actionUrl,
        actionText: template.actionText,
      });
    }
  });

  eventBus.on(EventName.COURSE_COMPLETED, async (payload) => {
    await createNotification({
      userId: payload.studentId,
      title: "Course Completed! 🎉",
      body: `Congratulations! You've completed "${payload.courseTitle}" with ${payload.completionPercentage}% completion.`,
      category: NotificationCategory.COURSE,
      priority: NotificationPriority.HIGH,
      actionUrl: `${APP_URL}/courses/${payload.courseId}`,
      courseId: payload.courseId,
    });
  });

  eventBus.on(EventName.COURSE_CHAPTER_ADDED, async (payload) => {
    const students = await getCourseStudents(payload.courseId);
    const userIds = students.map((s) => s.id);

    await createBulkNotifications(userIds, {
      title: "New Chapter Available",
      body: `A new chapter "${payload.chapterTitle}" has been added to "${payload.courseTitle}".`,
      category: NotificationCategory.COURSE,
      priority: NotificationPriority.MEDIUM,
      actionUrl: `${APP_URL}/courses/${payload.courseId}/chapters/${payload.chapterId}`,
      courseId: payload.courseId,
    });
  });

  // ─── Live Session Events ──────────────────────────────────────────────

  eventBus.on(EventName.LIVE_SESSION_STARTED, async (payload) => {
    const students = await getCourseStudents(payload.courseId);
    const userIds = students.map((s) => s.id);
    const sessionUrl = `${APP_URL}/courses/${payload.courseId}/live/${payload.sessionId}`;

    // In-app notifications for all enrolled students
    await createBulkNotifications(userIds, {
      title: "🔴 Live Session Started!",
      body: `${payload.teacherName} is now LIVE: "${payload.sessionTitle}" in "${payload.courseTitle}"`,
      category: NotificationCategory.LIVE_SESSION,
      priority: NotificationPriority.URGENT,
      actionUrl: sessionUrl,
      courseId: payload.courseId,
      metadata: { sessionId: payload.sessionId },
    });

    // SSE broadcast for instant notification
    sseManager.sendToUsers(userIds, {
      type: "live_session_started",
      data: {
        sessionId: payload.sessionId,
        sessionTitle: payload.sessionTitle,
        courseId: payload.courseId,
        courseTitle: payload.courseTitle,
        teacherName: payload.teacherName,
        url: sessionUrl,
      },
    });

    // Email notifications for all enrolled students
    const emailRecipients = [];
    for (const student of students) {
      if (
        student.email &&
        (await shouldSendEmail(student.id, NotificationCategory.LIVE_SESSION))
      ) {
        emailRecipients.push({
          email: student.email,
          userId: student.id,
          name: student.name || undefined,
        });
      }
    }

    if (emailRecipients.length > 0) {
      const template = emailTemplates.liveSessionStarted(
        payload.sessionTitle,
        payload.courseTitle,
        payload.teacherName,
        sessionUrl,
      );
      await sendBulkNotificationEmails(emailRecipients, {
        ...template,
        subject: template.subject,
        title: template.title,
        body: template.body,
      });
    }
  });

  eventBus.on(EventName.LIVE_SESSION_ENDED, async (payload) => {
    const students = await getCourseStudents(payload.courseId);
    const userIds = students.map((s) => s.id);

    sseManager.sendToUsers(userIds, {
      type: "live_session_ended",
      data: {
        sessionId: payload.sessionId,
        sessionTitle: payload.sessionTitle,
        duration: payload.duration,
        viewCount: payload.viewCount,
      },
    });
  });

  eventBus.on(EventName.LIVE_SESSION_SCHEDULED, async (payload) => {
    const students = await getCourseStudents(payload.courseId);
    const userIds = students.map((s) => s.id);
    const courseUrl = `${APP_URL}/courses/${payload.courseId}`;

    await createBulkNotifications(userIds, {
      title: "📅 Live Session Scheduled",
      body: `"${payload.sessionTitle}" is scheduled for ${payload.scheduledAt.toLocaleDateString()} in "${payload.courseTitle}"`,
      category: NotificationCategory.LIVE_SESSION,
      priority: NotificationPriority.MEDIUM,
      actionUrl: courseUrl,
      courseId: payload.courseId,
    });

    // Send emails
    const emailRecipients = [];
    for (const student of students) {
      if (
        student.email &&
        (await shouldSendEmail(student.id, NotificationCategory.LIVE_SESSION))
      ) {
        emailRecipients.push({
          email: student.email,
          userId: student.id,
          name: student.name || undefined,
        });
      }
    }

    if (emailRecipients.length > 0) {
      const template = emailTemplates.liveSessionScheduled(
        payload.sessionTitle,
        payload.courseTitle,
        payload.scheduledAt.toLocaleString(),
        courseUrl,
      );
      await sendBulkNotificationEmails(emailRecipients, {
        ...template,
        subject: template.subject,
        title: template.title,
        body: template.body,
      });
    }
  });

  eventBus.on(EventName.LIVE_POLL_CREATED, async (payload) => {
    // SSE-only for real-time poll display (no DB notification needed)
    // Broadcast to all connected users watching the session
    sseManager.broadcast({
      type: "live_poll",
      data: {
        sessionId: payload.sessionId,
        pollId: payload.pollId,
        question: payload.question,
        options: payload.options,
      },
    });
  });

  // ─── Assignment Events ────────────────────────────────────────────────

  eventBus.on(EventName.ASSIGNMENT_CREATED, async (payload) => {
    const students = await getCourseStudents(payload.courseId);
    const userIds = students.map((s) => s.id);
    const assignmentUrl = `${APP_URL}/courses/${payload.courseId}/assignments/${payload.assignmentId}`;

    await createBulkNotifications(userIds, {
      title: "New Assignment",
      body: `A new assignment "${payload.assignmentTitle}" has been added to "${payload.courseTitle}"${payload.dueDate ? `. Due: ${payload.dueDate.toLocaleDateString()}` : ""}.`,
      category: NotificationCategory.ASSIGNMENT,
      priority: NotificationPriority.HIGH,
      actionUrl: assignmentUrl,
      courseId: payload.courseId,
    });
  });

  eventBus.on(EventName.ASSIGNMENT_SUBMITTED, async (payload) => {
    // Notify teacher
    await createNotification({
      userId: payload.teacherId,
      title: "Assignment Submitted",
      body: `${payload.studentName} has submitted "${payload.assignmentTitle}"`,
      category: NotificationCategory.ASSIGNMENT,
      priority: NotificationPriority.MEDIUM,
      actionUrl: `${APP_URL}/teacher/courses/${payload.courseId}/assignments`,
      courseId: payload.courseId,
    });
  });

  eventBus.on(EventName.ASSIGNMENT_GRADED, async (payload) => {
    await createNotification({
      userId: payload.studentId,
      title: "Assignment Graded",
      body: `Your assignment "${payload.assignmentTitle}" has been graded: ${payload.grade}/${payload.maxGrade}`,
      category: NotificationCategory.GRADE,
      priority: NotificationPriority.HIGH,
      courseId: payload.courseId,
    });

    // Send email
    const student = await db.user.findUnique({
      where: { id: payload.studentId },
      select: { email: true },
    });
    if (
      student?.email &&
      (await shouldSendEmail(payload.studentId, NotificationCategory.GRADE))
    ) {
      const template = emailTemplates.assignmentGraded(
        payload.assignmentTitle,
        payload.grade,
        payload.maxGrade,
        payload.courseId,
      );
      await sendNotificationEmail({
        to: student.email,
        userId: payload.studentId,
        subject: template.subject,
        title: template.title,
        body: template.body,
        category: template.category,
        priority: template.priority,
        additionalInfo: template.additionalInfo,
      });
    }
  });

  eventBus.on(EventName.ASSIGNMENT_DUE_REMINDER, async (payload) => {
    const students = await getCourseStudents(payload.courseId);
    const assignmentUrl = `${APP_URL}/courses/${payload.courseId}/assignments/${payload.assignmentId}`;

    for (const student of students) {
      await createNotification({
        userId: student.id,
        title: "⏰ Assignment Due Soon",
        body: `"${payload.assignmentTitle}" in "${payload.courseTitle}" is due in ${payload.hoursUntilDue} hours!`,
        category: NotificationCategory.ASSIGNMENT,
        priority: NotificationPriority.URGENT,
        actionUrl: assignmentUrl,
        courseId: payload.courseId,
      });

      if (
        student.email &&
        (await shouldSendEmail(student.id, NotificationCategory.ASSIGNMENT))
      ) {
        const template = emailTemplates.assignmentDueReminder(
          payload.assignmentTitle,
          payload.courseTitle,
          payload.hoursUntilDue,
          assignmentUrl,
        );
        await sendNotificationEmail({
          to: student.email,
          userId: student.id,
          subject: template.subject,
          title: template.title,
          body: template.body,
          category: template.category,
          priority: template.priority,
          actionUrl: template.actionUrl,
          actionText: template.actionText,
        });
      }
    }
  });

  // ─── Quiz Events ──────────────────────────────────────────────────────

  eventBus.on(EventName.QUIZ_PUBLISHED, async (payload) => {
    const students = await getCourseStudents(payload.courseId);
    const userIds = students.map((s) => s.id);

    await createBulkNotifications(userIds, {
      title: "New Quiz Available",
      body: `A new quiz "${payload.quizTitle}" is now available in "${payload.courseTitle}".`,
      category: NotificationCategory.QUIZ,
      priority: NotificationPriority.MEDIUM,
      actionUrl: `${APP_URL}/courses/${payload.courseId}/chapters/${payload.chapterId}`,
      courseId: payload.courseId,
    });
  });

  eventBus.on(EventName.QUIZ_COMPLETED, async (payload) => {
    await createNotification({
      userId: payload.studentId,
      title: "Quiz Completed",
      body: `You scored ${payload.score}/${payload.maxScore} on "${payload.quizTitle}".`,
      category: NotificationCategory.QUIZ,
      priority: NotificationPriority.MEDIUM,
    });
  });

  // ─── Announcement Events ──────────────────────────────────────────────

  eventBus.on(EventName.ANNOUNCEMENT_CREATED, async (payload) => {
    const students = await getCourseStudents(payload.courseId);
    const userIds = students.map((s) => s.id);
    const courseUrl = `${APP_URL}/courses/${payload.courseId}`;

    await createBulkNotifications(userIds, {
      title: "📢 New Announcement",
      body: `${payload.teacherName} posted in "${payload.courseTitle}": ${payload.content.substring(0, 200)}`,
      category: NotificationCategory.ANNOUNCEMENT,
      priority: NotificationPriority.MEDIUM,
      actionUrl: courseUrl,
      courseId: payload.courseId,
    });

    // Send emails
    const emailRecipients = [];
    for (const student of students) {
      if (
        student.email &&
        (await shouldSendEmail(student.id, NotificationCategory.ANNOUNCEMENT))
      ) {
        emailRecipients.push({
          email: student.email,
          userId: student.id,
          name: student.name || undefined,
        });
      }
    }

    if (emailRecipients.length > 0) {
      const template = emailTemplates.announcementCreated(
        payload.courseTitle,
        payload.content,
        courseUrl,
      );
      await sendBulkNotificationEmails(emailRecipients, {
        ...template,
        subject: template.subject,
        title: template.title,
        body: template.body,
      });
    }
  });

  eventBus.on(EventName.GLOBAL_ANNOUNCEMENT_CREATED, async (payload) => {
    // SSE broadcast to all connected users
    sseManager.broadcast({
      type: "global_announcement",
      data: {
        id: payload.announcementId,
        title: payload.title,
        content: payload.content,
      },
    });
  });

  // ─── Certificate Events ───────────────────────────────────────────────

  eventBus.on(EventName.CERTIFICATE_ISSUED, async (payload) => {
    const downloadUrl = `${APP_URL}/courses/${payload.courseId}/certificate`;

    await createNotification({
      userId: payload.studentId,
      title: "🏆 Certificate Earned!",
      body: `Congratulations! You've earned a certificate for "${payload.courseTitle}" with ${payload.percentage.toFixed(1)}% score.`,
      category: NotificationCategory.CERTIFICATE,
      priority: NotificationPriority.HIGH,
      actionUrl: downloadUrl,
      courseId: payload.courseId,
    });

    const student = await db.user.findUnique({
      where: { id: payload.studentId },
      select: { email: true },
    });
    if (
      student?.email &&
      (await shouldSendEmail(
        payload.studentId,
        NotificationCategory.CERTIFICATE,
      ))
    ) {
      const template = emailTemplates.certificateIssued(
        payload.courseTitle,
        payload.grade || "N/A",
        payload.percentage,
        downloadUrl,
      );
      await sendNotificationEmail({
        to: student.email,
        userId: payload.studentId,
        subject: template.subject,
        title: template.title,
        body: template.body,
        category: template.category,
        priority: template.priority,
        additionalInfo: template.additionalInfo,
        actionUrl: template.actionUrl,
        actionText: template.actionText,
      });
    }
  });

  // ─── Payment Events ───────────────────────────────────────────────────

  eventBus.on(EventName.PAYMENT_COMPLETED, async (payload) => {
    const courseUrl = `${APP_URL}/courses/${payload.courseId}`;

    await createNotification({
      userId: payload.studentId,
      title: "Payment Confirmed ✅",
      body: `Your payment of ₹${payload.amount} for "${payload.courseTitle}" has been confirmed.`,
      category: NotificationCategory.PAYMENT,
      priority: NotificationPriority.HIGH,
      actionUrl: courseUrl,
      courseId: payload.courseId,
    });

    // Notify teacher of new sale
    await createNotification({
      userId: payload.teacherId,
      title: "New Sale! 💰",
      body: `Someone purchased "${payload.courseTitle}" for ₹${payload.amount}.`,
      category: NotificationCategory.PAYMENT,
      priority: NotificationPriority.MEDIUM,
      courseId: payload.courseId,
    });

    const student = await db.user.findUnique({
      where: { id: payload.studentId },
      select: { email: true },
    });
    if (
      student?.email &&
      (await shouldSendEmail(payload.studentId, NotificationCategory.PAYMENT))
    ) {
      const template = emailTemplates.paymentCompleted(
        payload.courseTitle,
        payload.amount,
        courseUrl,
      );
      await sendNotificationEmail({
        to: student.email,
        userId: payload.studentId,
        subject: template.subject,
        title: template.title,
        body: template.body,
        category: template.category,
        priority: template.priority,
        actionUrl: template.actionUrl,
        actionText: template.actionText,
      });
    }
  });

  eventBus.on(EventName.PAYMENT_FAILED, async (payload) => {
    await createNotification({
      userId: payload.studentId,
      title: "Payment Failed",
      body: `Your payment for "${payload.courseTitle}" could not be processed. ${payload.reason || "Please try again."}`,
      category: NotificationCategory.PAYMENT,
      priority: NotificationPriority.HIGH,
      courseId: payload.courseId,
    });
  });

  // ─── Discussion Events ────────────────────────────────────────────────

  eventBus.on(EventName.DISCUSSION_REPLY, async (payload) => {
    await createNotification({
      userId: payload.originalAuthorId,
      title: "New Reply to Your Discussion",
      body: `${payload.replierName} replied in "${payload.courseTitle}": ${payload.replyContent.substring(0, 100)}`,
      category: NotificationCategory.DISCUSSION,
      priority: NotificationPriority.LOW,
      actionUrl: `${APP_URL}/courses/${payload.courseId}/discussions/${payload.discussionId}`,
      courseId: payload.courseId,
    });
  });

  eventBus.on(EventName.DISCUSSION_MENTION, async (payload) => {
    await createNotification({
      userId: payload.mentionedUserId,
      title: "You Were Mentioned",
      body: `${payload.mentionerName} mentioned you in a discussion: ${payload.content.substring(0, 100)}`,
      category: NotificationCategory.DISCUSSION,
      priority: NotificationPriority.MEDIUM,
      actionUrl: `${APP_URL}/courses/${payload.courseId}/discussions/${payload.discussionId}`,
      courseId: payload.courseId,
    });
  });

  // ─── System Events ────────────────────────────────────────────────────

  eventBus.on(EventName.USER_WELCOME, async (payload) => {
    await createNotification({
      userId: payload.userId,
      title: `Welcome to ${process.env.NEXT_PUBLIC_APP_NAME || "LMS Platform"}! 👋`,
      body: "Explore courses, join live sessions, and start your learning journey.",
      category: NotificationCategory.SYSTEM,
      priority: NotificationPriority.LOW,
      actionUrl: APP_URL,
    });

    if (
      payload.email &&
      (await shouldSendEmail(payload.userId, NotificationCategory.SYSTEM))
    ) {
      const template = emailTemplates.welcome(payload.userName);
      await sendNotificationEmail({
        to: payload.email,
        userId: payload.userId,
        subject: template.subject,
        title: template.title,
        body: template.body,
        category: template.category,
        priority: template.priority,
        actionUrl: template.actionUrl,
        actionText: template.actionText,
      });
    }
  });

  eventBus.on(EventName.SYSTEM_MAINTENANCE, async (payload) => {
    sseManager.broadcast({
      type: "system_maintenance",
      data: {
        message: payload.message,
        scheduledAt: payload.scheduledAt,
        estimatedDuration: payload.estimatedDuration,
      },
    });
  });

  // ─── Final Exam Events ────────────────────────────────────────────────

  eventBus.on(EventName.FINAL_EXAM_AVAILABLE, async (payload) => {
    const students = await getCourseStudents(payload.courseId);
    const userIds = students.map((s) => s.id);

    await createBulkNotifications(userIds, {
      title: "📝 Final Exam Available",
      body: `The final exam for "${payload.courseTitle}" is now available. Good luck!`,
      category: NotificationCategory.QUIZ,
      priority: NotificationPriority.HIGH,
      actionUrl: `${APP_URL}/courses/${payload.courseId}/final-exam`,
      courseId: payload.courseId,
    });
  });

  eventBus.on(EventName.FINAL_EXAM_GRADED, async (payload) => {
    await createNotification({
      userId: payload.studentId,
      title: payload.passed ? "🎉 Final Exam Passed!" : "Final Exam Results",
      body: `You scored ${payload.score}/${payload.maxScore} on the final exam for "${payload.courseTitle}". ${payload.passed ? "Congratulations!" : "You can try again."}`,
      category: NotificationCategory.QUIZ,
      priority: NotificationPriority.HIGH,
      actionUrl: `${APP_URL}/courses/${payload.courseId}`,
      courseId: payload.courseId,
    });
  });

  // ─── Logging Middleware ───────────────────────────────────────────────

  eventBus.use({
    name: "notification-logger",
    handler: (eventName, payload) => {
      console.log(`[Event] ${eventName} fired at ${new Date().toISOString()}`);
    },
  });

  console.log(
    "[NotificationService] All event handlers registered successfully.",
  );
}
