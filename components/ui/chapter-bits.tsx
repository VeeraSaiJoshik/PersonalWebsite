"use client";

import { useMemo, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import CountUp from "./count-up";
import { tornClip } from "@/lib/paper/torn-edge";
import type { Stat } from "@/lib/chapters";

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Card stocks from the landing deck, pale enough to carry body text.
const stocks = [
  { stock: "#ecd2c1", ink: "#5f2f21" },
  { stock: "#e8dbb9", ink: "#4a3b22" },
  { stock: "#d3dfe6", ink: "#233a4f" },
  { stock: "#e6d3d6", ink: "#533a46" },
  { stock: "#d7dfca", ink: "#35462f" },
  { stock: "#f0e4cb", ink: "#5f2f21" },
];

export const stockVars = (index: number) => {
  const tone = stocks[index % stocks.length];
  return { "--entry-stock": tone.stock, "--entry-ink": tone.ink } as CSSProperties;
};

/** Leans a sheet toward the mouse. Touch has no hover, so it skips this entirely. */
export const tilt = {
  onPointerMove(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--lean-x", (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
    event.currentTarget.style.setProperty("--lean-y", (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
  },
  onPointerLeave(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.removeProperty("--lean-x");
    event.currentTarget.style.removeProperty("--lean-y");
  },
};

export function TornBacking({ seed, depth = 5, across, down, className = "" }: {
  seed: number;
  depth?: number;
  across?: number;
  down?: number;
  className?: string;
}) {
  const [face, fibre] = useMemo(() => [
    tornClip(seed, depth, across, down),
    tornClip(seed + 91, depth * 0.45, across, down),
  ], [seed, depth, across, down]);
  return (
    <span className={`torn ${className}`} aria-hidden="true">
      <span className="torn-fibre" style={{ clipPath: fibre }} />
      <span className="torn-face" style={{ clipPath: face }} />
    </span>
  );
}

/** Lands a piece on the sheet after the paper flattens, and sweeps it off on close. */
export function Deal({ order = 0, kind = "drop", className = "", children }: { order?: number; kind?: "drop" | "slap" | "slide"; className?: string; children: ReactNode }) {
  return (
    <div className={`deal deal-${kind} ${className}`} style={{ "--deal-order": order } as CSSProperties}>
      {children}
    </div>
  );
}

/** Counts up over an invisible copy of the final value, so nothing shifts as it runs. */
export function FigureValue({ stat, delay = 0 }: { stat: Stat; delay?: number }) {
  const [reduced] = useState(prefersReducedMotion);
  return (
    <>
      <span className="figure-ghost">{stat.value}</span>
      {!reduced && stat.count && (
        <span className="figure-count">
          <CountUp
            to={stat.count.to}
            prefix={stat.count.prefix}
            suffix={stat.count.suffix}
            separator={stat.count.separator}
            duration={1.1}
            delay={delay}
            easing="spring"
          />
        </span>
      )}
    </>
  );
}

/** A single figure for inside a button, where a description list isn't allowed. */
export function EntryFigure({ stat, delay }: { stat: Stat; delay?: number }) {
  return (
    <span className="entry-figure">
      <span className="figure-value"><FigureValue stat={stat} delay={delay} /></span>
      <span className="figure-label">{stat.label}</span>
    </span>
  );
}

export function Figures({ stats, delay }: { stats?: Stat[]; delay?: number }) {
  if (!stats?.length) return null;
  return (
    <dl className="figures">
      {stats.map(stat => (
        <div className="figure" key={stat.label}>
          <dt className="figure-label">{stat.label}</dt>
          <dd className="figure-value"><FigureValue stat={stat} delay={delay} /></dd>
        </div>
      ))}
    </dl>
  );
}

export function Tools({ tools }: { tools?: string[] }) {
  if (!tools?.length) return null;
  return (
    <ul className="tools" aria-label="Tools">
      {tools.map(tool => <li key={tool}>{tool}</li>)}
    </ul>
  );
}
