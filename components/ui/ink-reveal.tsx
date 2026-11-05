"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

interface InkRevealProps {
  base: ReactNode;
  revealed: ReactNode;
  label: string;
  activeLabel: string;
  announcement: ReactNode;
  className?: string;
  describedBy?: string;
}

type Drop = { x: number; y: number; radius: number; born: number };
const DROP_COUNT = 22;
const TRAIL_LIFE = 1050;

/** Complementary SVG masks uncover a second layer with a dissolving ink trail. */
export function InkReveal({
  base,
  revealed,
  label,
  activeLabel,
  announcement,
  className = "",
  describedBy,
}: InkRevealProps) {
  const id = useId().replace(/:/g, "");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const positiveRef = useRef<SVGGElement>(null);
  const negativeRef = useRef<SVGGElement>(null);
  const frameRef = useRef(0);
  const dropsRef = useRef<Drop[]>([]);
  const pointRef = useRef({ x: 0, y: 0, active: false });
  const previousRef = useRef({ x: 0, y: 0, time: 0 });
  const reducedRef = useRef(false);
  const pinnedRef = useRef(false);
  const boundsRef = useRef({ width: 1, height: 1 });
  const [pinned, setPinned] = useState(false);

  function clear() {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    dropsRef.current = [];
    for (const group of [positiveRef.current, negativeRef.current]) {
      for (const circle of group?.children ?? []) circle.setAttribute("r", "0");
    }
    if (buttonRef.current) buttonRef.current.dataset.trail = "idle";
  }

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => {
      reducedRef.current = media.matches;
      button.dataset.reducedMotion = String(media.matches);
      clear();
    };
    const resize = () => {
      const { width, height } = button.getBoundingClientRect();
      boundsRef.current = { width, height };
      svgRef.current?.setAttribute("viewBox", `0 0 ${width} ${height}`);
      pointRef.current.active = false;
      button.dataset.hovered = "false";
      clear();
    };
    const onVisibility = () => {
      if (document.hidden) {
        pointRef.current.active = false;
        button.dataset.hovered = "false";
        clear();
      }
    };
    updateMotion();
    const observer = new ResizeObserver(resize);
    observer.observe(button);
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clear();
      observer.disconnect();
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function animate(time: number) {
    frameRef.current = 0;
    if (pinnedRef.current || reducedRef.current) {
      clear();
      return;
    }
    const point = pointRef.current;
    const previous = previousRef.current;
    const drops = dropsRef.current.filter(
      (drop) => time - drop.born < TRAIL_LIFE,
    );
    if (point.active && time - previous.time > 35) {
      const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
      const radius = Math.min(
        90,
        Math.max(38, boundsRef.current.height * 0.33),
      );
      const count = Math.min(5, Math.max(1, Math.ceil(distance / 22)));
      for (let step = 1; step <= count; step++) {
        const amount = step / count;
        drops.push({
          x: previous.x + (point.x - previous.x) * amount,
          y: previous.y + (point.y - previous.y) * amount,
          radius: radius * (1 + Math.min(distance, 80) / 240),
          born: time,
        });
      }
      previousRef.current = { x: point.x, y: point.y, time };
    }
    dropsRef.current = drops.slice(-DROP_COUNT);
    for (const group of [positiveRef.current, negativeRef.current]) {
      if (!group) continue;
      for (let index = 0; index < DROP_COUNT; index++) {
        const drop = dropsRef.current[index];
        const circle = group.children[index];
        if (!drop) {
          circle.setAttribute("r", "0");
          continue;
        }
        const age = (time - drop.born) / TRAIL_LIFE;
        const size = Math.pow(1 - age, 0.65);
        circle.setAttribute(
          "cx",
          String(drop.x + Math.sin(age * 4 + index) * age * 8),
        );
        circle.setAttribute("cy", String(drop.y - age * 9));
        circle.setAttribute("r", String(drop.radius * size));
      }
    }
    if (buttonRef.current)
      buttonRef.current.dataset.trail = drops.length ? "flowing" : "idle";
    if (point.active || drops.length)
      frameRef.current = requestAnimationFrame(animate);
  }

  function followPointer(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    if (!pointRef.current.active) previousRef.current = { x, y, time: 0 };
    pointRef.current = { x, y, active: true };
    event.currentTarget.dataset.hovered = "true";
    if (!frameRef.current && !pinnedRef.current && !reducedRef.current)
      frameRef.current = requestAnimationFrame(animate);
  }

  function leavePointer() {
    pointRef.current.active = false;
    if (buttonRef.current) buttonRef.current.dataset.hovered = "false";
  }

  function toggle() {
    pinnedRef.current = !pinnedRef.current;
    setPinned(pinnedRef.current);
    clear();
    if (!pinnedRef.current && pointRef.current.active && !reducedRef.current)
      frameRef.current = requestAnimationFrame(animate);
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`ink-reveal ${className}`}
      data-revealed={pinned}
      data-hovered="false"
      data-trail="idle"
      aria-label={pinned ? activeLabel : label}
      aria-pressed={pinned}
      aria-describedby={describedBy}
      onPointerEnter={followPointer}
      onPointerMove={followPointer}
      onPointerLeave={leavePointer}
      onPointerCancel={leavePointer}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          leavePointer();
          clear();
          pinnedRef.current = false;
          setPinned(false);
        }
      }}
    >
      <svg
        ref={svgRef}
        className="ink-mask-definitions"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id={`${id}-liquid`}
            x="-30%"
            y="-50%"
            width="160%"
            height="200%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="soft" />
            <feColorMatrix
              in="soft"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
              result="ink"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency=".025 .045"
              numOctaves="2"
              seed="12"
              result="paper"
            />
            <feDisplacementMap
              in="ink"
              in2="paper"
              scale="19"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <mask
            id={`${id}-positive`}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="100%"
            height="100%"
            style={{ maskType: "luminance" }}
          >
            <g ref={positiveRef} fill="white" filter={`url(#${id}-liquid)`}>
              {Array.from({ length: DROP_COUNT }, (_, i) => (
                <circle key={i} r="0" />
              ))}
            </g>
          </mask>
          <mask
            id={`${id}-negative`}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x="0"
            y="0"
            width="100%"
            height="100%"
            style={{ maskType: "luminance" }}
          >
            <rect width="100%" height="100%" fill="white" />
            <g ref={negativeRef} fill="black" filter={`url(#${id}-liquid)`}>
              {Array.from({ length: DROP_COUNT }, (_, i) => (
                <circle key={i} r="0" />
              ))}
            </g>
          </mask>
        </defs>
      </svg>
      <span
        className="ink-base"
        aria-hidden="true"
        style={{ maskImage: `url(#${id}-negative)` }}
      >
        {base}
      </span>
      <span
        className="ink-overlay"
        aria-hidden="true"
        style={{ maskImage: `url(#${id}-positive)` }}
      >
        {revealed}
      </span>
      <span className="sr-only" role="status" aria-live="polite">
        {pinned && announcement}
      </span>
    </button>
  );
}
