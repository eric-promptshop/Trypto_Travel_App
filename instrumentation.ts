import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Server-side configuration
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      profilesSampleRate: 0.1,
      debug: process.env.NODE_ENV === "development",
      
      integrations: [
        Sentry.captureConsoleIntegration({
          levels: ["error", "warn"],
        }),
      ],

      beforeSend(event, hint) {
        // Don't send events in development unless explicitly enabled
        if (process.env.NODE_ENV === "development" && !process.env.SENTRY_SEND_DEV_EVENTS) {
          return null;
        }

        // Filter out health check errors
        if (event.request?.url?.includes("/api/health")) {
          return null;
        }

        // Scrub sensitive data
        if (event.request?.headers) {
          const sensitiveHeaders = ["authorization", "cookie", "x-api-key"];
          sensitiveHeaders.forEach(header => {
            delete event.request.headers[header];
          });
        }

        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime configuration
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      debug: process.env.NODE_ENV === "development",

      beforeSend(event, hint) {
        // Don't send events in development
        if (process.env.NODE_ENV === "development") {
          return null;
        }

        // Filter middleware errors
        if (event.request?.url?.includes("/_next/")) {
          return null;
        }

        return event;
      },
    });
  }
}