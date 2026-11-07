import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "../../../../../lib/env";
import { demoRoleSchema, getDemoSession, parseDemoRole } from "../../../../../lib/auth/mock-session";

const sessionCookieName = "eh_demo_role";
const sessionRequestSchema = z.object({ role: demoRoleSchema }).strict();

function demoUnavailable() {
  return NextResponse.json({
    error: { code: "demo_auth_disabled", message: "Demo role switching is unavailable outside mock auth mode." },
  }, { status: 404 });
}

function sessionResponse(role: unknown) {
  const session = getDemoSession(role);
  return NextResponse.json({
    data: {
      userId: session.userId,
      displayName: session.displayName,
      role: session.role,
      shopId: session.shopId,
      ownerId: session.ownerId ?? null,
      mode: "mock",
      sampleData: true,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  if (env.AUTH_MODE !== "mock") return demoUnavailable();
  const cookieStore = await cookies();
  return sessionResponse(parseDemoRole(cookieStore.get(sessionCookieName)?.value));
}

export async function POST(request: Request) {
  if (env.AUTH_MODE !== "mock") return demoUnavailable();
  const body: unknown = await request.json().catch(() => null);
  const parsed = sessionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      error: { code: "invalid_body", message: "Select one of the supported demo roles." },
    }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, parsed.data.role, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return sessionResponse(parsed.data.role);
}