import { createEnv } from "@t3-oss/env-nextjs";
import { vercel } from "@t3-oss/env-nextjs/presets-zod";
import { z } from "zod/v4";

export const env = createEnv({
  extends: [vercel()],
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  server: {
    GOOGLE_SHEETS_ID: z.string().optional(),
    GOOGLE_SHEETS_URL: z.string().optional(),
    DEV_GOOGLE_SHEETS_URL: z.string().optional(),
    DEV_GOOGLE_SHEETS_ID: z.string().optional(),
    GOOGLE_SHEETS_DEV_URL: z.string().optional(),
    GOOGLE_SHEETS_DEV_ID: z.string().optional(),
    GOOGLE_SHEETS_OPENING_HOURS_ID: z.string().optional(),
    GOOGLE_SHEETS_OPENING_HOURS_URL: z.string().optional(),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
    GOOGLE_PRIVATE_KEY: z.string().optional(),
    REVALIDATION_SECRET: z.string().optional(),
    GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_ID: z.string().optional(),
    GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_URL: z.string().optional(),
    DEV_GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_ID: z.string().optional(),
    DEV_GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_URL: z.string().optional(),
    GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_DEV_ID: z.string().optional(),
    GOOGLE_SHEETS_CATEGORY_SUGGESTIONS_DEV_URL: z.string().optional(),
  },
  client: {
    // Client environment variables if needed
  },
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation:
    !!process.env.CI ||
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint",
});
