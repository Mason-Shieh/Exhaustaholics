import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DemoPlayer from "@/components/demo-player";

export const metadata: Metadata = {
  title: "Exhaustaholics | Product demo",
  description: "A three-minute walkthrough of the Exhaustaholics shop workspace, route designer, quoting and role-based access.",
};

export default function DemoPage() {
  return (
    <main className="demo-page">
      <header className="demo-header">
        <Link className="brand-lockup" href="/">
          <span className="brand-mark" aria-hidden="true">E</span>
          <span className="brand-wordmark">EXHAUST<span>AHOLICS</span></span>
        </Link>
        <Link className="quiet-button demo-back" href="/"><ArrowLeft aria-hidden="true" size={15} /> Open the workspace</Link>
      </header>
      <section className="demo-intro">
        <div className="eyebrow"><span className="eyebrow-line" /> PRODUCT DEMO</div>
        <h1>See Exhaustaholics in three minutes</h1>
        <p className="heading-subtitle">Shop pipeline, route designer, project intake, transparent quotes and role-based access, recorded from this live demo with sample data.</p>
      </section>
      <DemoPlayer />
      <p className="demo-footnote">Sample data only. Vehicle envelopes are approximate; always verify measurements and fit before fabrication.</p>
    </main>
  );
}
