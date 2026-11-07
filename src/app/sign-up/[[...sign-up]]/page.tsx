import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { env } from "../../../../lib/env";

export default function SignUpPage() {
  if (env.AUTH_MODE === "mock") {
    return <main className="auth-notice"><h1>Demo workspace</h1><p>Real account creation requires Clerk configuration. The demo has no external identity provider enabled.</p><Link href="/">Open demo workspace</Link></main>;
  }
  return <main className="auth-page"><SignUp /></main>;
}