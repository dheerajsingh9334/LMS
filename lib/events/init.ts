/**
 * Event System Initializer
 *
 * Initializes the event-driven notification system on server startup.
 * This should be called once when the server boots up.
 * Uses a singleton pattern to prevent double-initialization.
 */

import { registerNotificationHandlers } from "./notification-service";

let initialized = false;

export function initializeEventSystem(): void {
  if (initialized) {
    return;
  }

  console.log("[EventSystem] Initializing event-driven notification system...");

  registerNotificationHandlers();

  initialized = true;
  console.log("[EventSystem] Event system initialized successfully.");
}

// Auto-initialize on import (server-side only)
if (typeof window === "undefined") {
  initializeEventSystem();
}
