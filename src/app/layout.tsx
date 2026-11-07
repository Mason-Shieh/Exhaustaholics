import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import { env } from "../../lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exhaustaholics | Shop Workspace",
  description: "Design and manage custom exhaust projects before fabrication.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const document = (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
  return env.AUTH_MODE === "clerk" ? <ClerkProvider>{document}</ClerkProvider> : document;
}
