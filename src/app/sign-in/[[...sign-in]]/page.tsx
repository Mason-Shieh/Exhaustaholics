import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { env } from "../../../../lib/env";

export default function SignInPage() {
  if (env.AUTH_MODE === "mock") {
    return <main className="auth-notice"><h1>Demo workspace</h1><p>Use the role switcher in the shop workspace. Real sign-in is available when Clerk is configured.</p><Link href="/">Open demo workspace</Link></main>;
  }
  return <main className="auth-page"><SignIn /></main>;
}