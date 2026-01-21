"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for visibility in Vercel
    // Avoid sending sensitive data; only message/stack
    console.error("App error boundary:", {
      message: error.message,
      stack: error.stack,
    });
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We hit an unexpected error while rendering this page.
          </p>
          <div className="text-xs text-muted-foreground break-words">
            {error.message}
          </div>
          <button
            onClick={() => reset()}
            className="inline-flex items-center rounded-md bg-black px-3 py-1.5 text-white hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
