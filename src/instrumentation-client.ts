import * as Sentry from "@sentry/nextjs";

// Bật khi có NEXT_PUBLIC_SENTRY_DSN (đặt trên Vercel). Không có thì no-op.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  });
}

// Theo dõi điều hướng client (Next App Router)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
