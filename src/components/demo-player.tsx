"use client";

import { useRef, useState } from "react";

const chapters = [
  { at: 0, label: "Introduction" },
  { at: 14, label: "Shop overview" },
  { at: 33, label: "Route designer" },
  { at: 70, label: "Project intake" },
  { at: 96, label: "Garage & quotes" },
  { at: 120, label: "Role-based access" },
  { at: 146, label: "Under the hood" },
  { at: 155, label: "Roadmap" },
];

const timestamp = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export default function DemoPlayer() {
  const video = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);
  const active = chapters.reduce((index, chapter, i) => (current >= chapter.at ? i : index), 0);

  function seek(seconds: number) {
    const element = video.current;
    if (!element) return;
    element.currentTime = seconds;
    void element.play().catch(() => undefined);
  }

  return (
    <section className="demo-player">
      <div className="demo-video-frame">
        <video
          controls
          onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
          playsInline
          poster="/demo/poster.jpg"
          preload="metadata"
          ref={video}
        >
          <source src="/demo/exhaustaholics-demo.mp4" type="video/mp4" />
          Your browser cannot play this video. <a href="/demo/exhaustaholics-demo.mp4">Download the demo</a>.
        </video>
      </div>
      <nav aria-label="Demo chapters" className="demo-chapters">
        {chapters.map((chapter, index) => (
          <button aria-current={index === active ? "true" : undefined} className={index === active ? "is-active" : ""} key={chapter.at} onClick={() => seek(chapter.at)} type="button">
            <span className="tabular">{timestamp(chapter.at)}</span>
            {chapter.label}
          </button>
        ))}
      </nav>
    </section>
  );
}
