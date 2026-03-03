/**
 * SSE (Server-Sent Events) Connection Manager
 *
 * Manages real-time notification delivery to connected clients.
 * Supports:
 * - Multiple connections per user (different tabs/devices)
 * - Heartbeat to keep connections alive
 * - Connection cleanup for stale clients
 * - Broadcast to specific users or all users
 * - Scales via user-specific channels
 */

import { SSEClient } from "./types";

class SSEManager {
  private static instance: SSEManager;
  private clients: Map<string, SSEClient[]> = new Map(); // userId -> clients
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30_000; // 30 seconds
  private readonly STALE_TIMEOUT = 120_000; // 2 minutes without heartbeat response
  private readonly MAX_CONNECTIONS_PER_USER = 5; // Prevent connection flooding

  private constructor() {
    this.startHeartbeat();
    this.startCleanup();
  }

  static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  /**
   * Register a new SSE client connection
   */
  addClient(client: SSEClient): void {
    const userClients = this.clients.get(client.userId) || [];

    // Enforce max connections per user
    if (userClients.length >= this.MAX_CONNECTIONS_PER_USER) {
      // Remove oldest connection
      const oldest = userClients.shift();
      if (oldest) {
        try {
          oldest.controller.close();
        } catch {
          // Controller may already be closed
        }
      }
    }

    userClients.push(client);
    this.clients.set(client.userId, userClients);

    console.log(
      `[SSE] Client connected: ${client.userId} (${userClients.length} connections)`,
    );
  }

  /**
   * Remove a specific client connection
   */
  removeClient(clientId: string): void {
    for (const [userId, clients] of this.clients.entries()) {
      const filtered = clients.filter((c) => c.id !== clientId);
      if (filtered.length === 0) {
        this.clients.delete(userId);
      } else {
        this.clients.set(userId, filtered);
      }
    }
  }

  /**
   * Send a notification to a specific user (all their connections)
   */
  sendToUser(userId: string, data: any): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.length === 0) return;

    const message = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    const staleClients: string[] = [];

    for (const client of userClients) {
      try {
        client.controller.enqueue(encoded);
      } catch {
        staleClients.push(client.id);
      }
    }

    // Clean up stale clients
    for (const clientId of staleClients) {
      this.removeClient(clientId);
    }
  }

  /**
   * Send a notification to multiple users
   */
  sendToUsers(userIds: string[], data: any): void {
    for (const userId of userIds) {
      this.sendToUser(userId, data);
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(data: any): void {
    for (const userId of this.clients.keys()) {
      this.sendToUser(userId, data);
    }
  }

  /**
   * Get number of connected users
   */
  getConnectedUserCount(): number {
    return this.clients.size;
  }

  /**
   * Get total number of connections
   */
  getTotalConnectionCount(): number {
    let count = 0;
    for (const clients of this.clients.values()) {
      count += clients.length;
    }
    return count;
  }

  /**
   * Check if a user is currently connected
   */
  isUserConnected(userId: string): boolean {
    return (this.clients.get(userId)?.length || 0) > 0;
  }

  /**
   * Get connected users list (for admin dashboard)
   */
  getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  // ============================================================================
  // Internal maintenance
  // ============================================================================

  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      const encoder = new TextEncoder();
      const heartbeat = encoder.encode(`: heartbeat\n\n`);

      for (const [userId, clients] of this.clients.entries()) {
        const staleClients: string[] = [];

        for (const client of clients) {
          try {
            client.controller.enqueue(heartbeat);
            client.lastHeartbeat = Date.now();
          } catch {
            staleClients.push(client.id);
          }
        }

        for (const clientId of staleClients) {
          this.removeClient(clientId);
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private startCleanup(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      for (const [userId, clients] of this.clients.entries()) {
        const activeClients = clients.filter((c) => {
          if (now - c.lastHeartbeat > this.STALE_TIMEOUT) {
            try {
              c.controller.close();
            } catch {
              // Already closed
            }
            return false;
          }
          return true;
        });

        if (activeClients.length === 0) {
          this.clients.delete(userId);
        } else {
          this.clients.set(userId, activeClients);
        }
      }
    }, this.STALE_TIMEOUT);
  }

  /**
   * Graceful shutdown
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all connections
    for (const clients of this.clients.values()) {
      for (const client of clients) {
        try {
          client.controller.close();
        } catch {
          // Already closed
        }
      }
    }
    this.clients.clear();
  }
}

export const sseManager = SSEManager.getInstance();
export { SSEManager };
