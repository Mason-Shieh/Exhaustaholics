import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().url().optional(),
);

const optionalSecret = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().min(1).optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_MODE: z.enum(["mock", "clerk"]).default("mock"),
  DATABASE_URL: optionalUrl,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optionalSecret,
  CLERK_SECRET_KEY: optionalSecret,
  STRIPE_SECRET_KEY: optionalSecret,
  STRIPE_WEBHOOK_SECRET: optionalSecret,
  S3_ENDPOINT: optionalUrl,
  S3_BUCKET: optionalSecret,
  S3_ACCESS_KEY_ID: optionalSecret,
  S3_SECRET_ACCESS_KEY: optionalSecret,
  RESEND_API_KEY: optionalSecret,
}).refine(
  (values) => values.AUTH_MODE === "mock" || Boolean(values.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && values.CLERK_SECRET_KEY),
  { message: "AUTH_MODE=clerk requires both Clerk keys." },
);

export const env = envSchema.parse(process.env);
export type AppEnvironment = z.infer<typeof envSchema>;