import * as Sentry from "@sentry/nextjs";

// Chỉ bật khi có DSN (đặt biến môi trường SENTRY_DSN trên Vercel).
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV ?? "development",
  });
}
