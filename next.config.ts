import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  // playwright-core's own file tracing misses its non-JS metadata (browsers.json)
  // and @sparticuz/chromium's brotli-compressed binary when Next traces the
  // /api/reports/[type] serverless function — force both in explicitly.
  outputFileTracingIncludes: {
    "/api/reports/[type]": [
      "./node_modules/playwright-core/**/*",
      "./node_modules/@sparticuz/chromium/**/*",
    ],
  },
};

export default withNextIntl(nextConfig);
