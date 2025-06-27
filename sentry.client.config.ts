// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay
  integrations: [
    Sentry.replayIntegration({
      // Capture 10% of all sessions in production
      sessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      // Capture 100% of sessions with an error
      errorSampleRate: 1.0,
      // Mask all sensitive data
      maskAllText: true,
      maskAllInputs: true,
    }),
  ],

  // Set sample rate for profiling
  profilesSampleRate: 0.1,

  // Debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    // Random network errors
    "Network request failed",
    "NetworkError",
    "Failed to fetch",
    // Chunk load errors (we already handle these)
    "ChunkLoadError",
    "Loading chunk",
  ],

  beforeSend(event, hint) {
    // Filter out non-application errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Filter out third-party script errors
      if (error && error.message && error.message.includes("Script error")) {
        return null;
      }
      
      // Filter out browser extension errors
      if (event.exception.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes("extension://")
      )) {
        return null;
      }
    }

    // Scrub sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    
    if (event.user) {
      // Only keep non-sensitive user data
      event.user = {
        id: event.user.id,
        email: undefined, // Remove email
        username: undefined, // Remove username
      };
    }

    return event;
  },
});