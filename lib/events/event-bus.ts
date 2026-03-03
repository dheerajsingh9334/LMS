/**
 * EventBus - Core Event-Driven Architecture
 *
 * A singleton pub/sub event bus that enables decoupled communication between
 * different parts of the LMS application. Supports:
 * - Type-safe event emission and subscription
 * - Wildcard listeners (listen to all events)
 * - Async event handlers with error isolation
 * - Event history for debugging
 * - Middleware support for cross-cutting concerns (logging, metrics)
 * - Rate limiting to prevent event storms
 */

import { EventMap, EventName } from "./types";

type EventHandler<T = any> = (payload: T) => void | Promise<void>;

interface EventMiddleware {
  name: string;
  handler: (eventName: string, payload: any) => void | Promise<void>;
}

interface EventHistoryEntry {
  eventName: string;
  payload: any;
  timestamp: Date;
  handlerCount: number;
}

class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private wildcardListeners: Set<EventHandler> = new Set();
  private middlewares: EventMiddleware[] = [];
  private eventHistory: EventHistoryEntry[] = [];
  private maxHistorySize = 1000;
  private rateLimitMap: Map<string, { count: number; resetAt: number }> =
    new Map();
  private rateLimitWindow = 60_000; // 1 minute
  private rateLimitMax = 500; // max events per window per event type

  private constructor() {
    // Singleton - use EventBus.getInstance()
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to a specific event type
   */
  on<K extends EventName>(
    eventName: K,
    handler: EventHandler<EventMap[K]>,
  ): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventName)?.delete(handler);
    };
  }

  /**
   * Subscribe to all events (useful for logging, analytics, etc.)
   */
  onAny(
    handler: EventHandler<{ eventName: string; payload: any }>,
  ): () => void {
    this.wildcardListeners.add(handler);
    return () => {
      this.wildcardListeners.delete(handler);
    };
  }

  /**
   * Subscribe to an event, but only handle it once
   */
  once<K extends EventName>(
    eventName: K,
    handler: EventHandler<EventMap[K]>,
  ): () => void {
    const wrappedHandler: EventHandler<EventMap[K]> = (payload) => {
      this.listeners.get(eventName)?.delete(wrappedHandler);
      return handler(payload);
    };
    return this.on(eventName, wrappedHandler);
  }

  /**
   * Emit an event to all registered listeners
   * Handlers are called concurrently with error isolation
   */
  async emit<K extends EventName>(
    eventName: K,
    payload: EventMap[K],
  ): Promise<void> {
    // Rate limiting check
    if (!this.checkRateLimit(eventName)) {
      console.warn(`[EventBus] Rate limit exceeded for event: ${eventName}`);
      return;
    }

    const handlers = this.listeners.get(eventName) || new Set();
    const handlerCount = handlers.size + this.wildcardListeners.size;

    // Record in history
    this.recordHistory(eventName, payload, handlerCount);

    // Execute middlewares (fire-and-forget with error isolation)
    for (const middleware of this.middlewares) {
      try {
        await middleware.handler(eventName, payload);
      } catch (error) {
        console.error(
          `[EventBus] Middleware "${middleware.name}" error for ${eventName}:`,
          error,
        );
      }
    }

    // Execute specific event handlers concurrently
    const handlerPromises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(payload);
      } catch (error) {
        console.error(
          `[EventBus] Handler error for event ${eventName}:`,
          error,
        );
      }
    });

    // Execute wildcard handlers concurrently
    const wildcardPromises = Array.from(this.wildcardListeners).map(
      async (handler) => {
        try {
          await handler({ eventName, payload });
        } catch (error) {
          console.error(
            `[EventBus] Wildcard handler error for event ${eventName}:`,
            error,
          );
        }
      },
    );

    await Promise.allSettled([...handlerPromises, ...wildcardPromises]);
  }

  /**
   * Add middleware that runs before every event handler
   */
  use(middleware: EventMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Remove all listeners for a specific event
   */
  removeAllListeners(eventName?: EventName): void {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
      this.wildcardListeners.clear();
    }
  }

  /**
   * Get the number of listeners for a specific event
   */
  listenerCount(eventName: EventName): number {
    return (
      (this.listeners.get(eventName)?.size || 0) + this.wildcardListeners.size
    );
  }

  /**
   * Get recent event history (useful for debugging)
   */
  getHistory(limit = 50): EventHistoryEntry[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Get all registered event names
   */
  getRegisteredEvents(): string[] {
    return Array.from(this.listeners.keys());
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  private checkRateLimit(eventName: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(eventName);

    if (!entry || now > entry.resetAt) {
      this.rateLimitMap.set(eventName, {
        count: 1,
        resetAt: now + this.rateLimitWindow,
      });
      return true;
    }

    if (entry.count >= this.rateLimitMax) {
      return false;
    }

    entry.count++;
    return true;
  }

  private recordHistory(
    eventName: string,
    payload: any,
    handlerCount: number,
  ): void {
    this.eventHistory.push({
      eventName,
      payload,
      timestamp: new Date(),
      handlerCount,
    });

    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(
        -Math.floor(this.maxHistorySize * 0.8),
      );
    }
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();
export { EventBus };
