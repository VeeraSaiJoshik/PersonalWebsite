"use client";

import { InkReveal } from "@/components/ui/ink-reveal";

export function NamasteReveal() {
  return (
    <InkReveal
      className="namaste-reveal"
      base={<span className="greeting-english">Namaste</span>}
      revealed={
        <span className="greeting-telugu" lang="te">
          నమస్కారం
        </span>
      }
      label="Reveal Namaskaram in Telugu"
      activeLabel="Show Namaste in English"
      announcement={
        <>
          <span lang="te">నమస్కారం</span> — Namaskaram in Telugu.
        </>
      }
      describedBy="greeting-hint"
    />
  );
}
