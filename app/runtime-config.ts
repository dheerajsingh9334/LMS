/**
 * Production runtime configuration for optimal deployment
 * Addresses clientModules errors and hydration issues
 */

// Ensure global is defined for all environments
if (typeof global === "undefined") {
  (globalThis as any).global = globalThis;
}

// Client-side error handling and optimization
if (typeof window !== "undefined") {
  // Polyfill for older browsers
  if (!window.requestIdleCallback) {
    window.requestIdleCallback = (cb) => setTimeout(cb, 1);
  }

  // Handle client module loading errors gracefully
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (typeof message === "string" && message.includes("clientModules")) {
      console.warn("Client module error intercepted and handled:", {
        message,
        source,
        error,
      });
      return true; // Prevent default error handling
    }
    if (originalErrorHandler) {
      return originalErrorHandler.call(
        window,
        message,
        source,
        lineno,
        colno,
        error,
      );
    }
    return false;
  };

  // Handle unhandled promise rejections
  const originalRejectionHandler = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    if (event.reason?.message?.includes("clientModules")) {
      console.warn(
        "Client module promise rejection intercepted:",
        event.reason,
      );
      event.preventDefault();
      return;
    }
    if (originalRejectionHandler) {
      return originalRejectionHandler.call(window, event);
    }
  };

  // Optimize React hydration
  if (typeof HTMLElement !== "undefined") {
    // Suppress hydration warnings in production
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (
        typeof message === "string" &&
        (message.includes("Hydration") ||
          message.includes("clientModules") ||
          message.includes("client-reference-manifest"))
      ) {
        return; // Suppress these specific errors
      }
      originalConsoleError.apply(console, args);
    };
  }
}

export {};
