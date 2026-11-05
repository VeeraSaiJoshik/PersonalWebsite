"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ImgHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { captureImage, capturePage } from "@/lib/paper/capture";
import type { PaperSurface } from "@/lib/paper/paper-surface";

const loadSurface = () => import("@/lib/paper/paper-surface");
type Grab = {
  image: HTMLElement; startX: number; startY: number; x: number; y: number;
  pointer: number; active: boolean; released: boolean; instant: boolean; timer?: ReturnType<typeof setTimeout>;
};
const PaperContext = createContext<{
  begin: (image: HTMLElement, x: number, y: number, pointer: number) => void;
  suppressClick: (image: HTMLElement) => boolean;
} | null>(null);

function DraggedPaper({ grab, onDone }: { grab: Grab; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const image = grab.image, canvas = canvasRef.current!;
    const abort = new AbortController();
    const oldOpacity = image.style.opacity;
    image.dataset.paperGrabbed = "true";
    let surface: PaperSurface | undefined, frame = 0, previous = 0;
    let x = 0, y = 0, fold = 0;
    const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = image.getBoundingClientRect();
    let rotation = 0;
    for (let node: HTMLElement | null = image; node; node = node.parentElement) {
      const css = getComputedStyle(node);
      if (css.transform !== "none") { const matrix = new DOMMatrix(css.transform); rotation += Math.atan2(matrix.b, matrix.a) * 180 / Math.PI; }
      if (css.rotate !== "none") rotation += parseFloat(css.rotate) || 0;
    }
    const render = (now: number) => {
      if (abort.signal.aborted) return;
      if (grab.instant || !image.isConnected) { onDone(); return; }
      const dt = previous ? Math.min(0.04, (now - previous) / 1000) : 1 / 60;
      previous = now;
      const restoring = grab.released;
      const targetX = restoring ? 0 : grab.x - grab.startX;
      const targetY = restoring ? 0 : grab.y - grab.startY;
      const targetFold = restoring || reduced() ? 0 : 0.83;
      const follow = restoring ? 1 - Math.exp(-dt * 12) : 1 - Math.exp(-dt * 30);
      x += (targetX - x) * follow; y += (targetY - y) * follow;
      fold += (targetFold - fold) * (1 - Math.exp(-dt * (restoring ? 10 : 8)));
      if (reduced()) { x = targetX; y = targetY; fold = 0; }
      surface?.render(fold, x, y, reduced() ? 0 : Math.max(-10, Math.min(10, x / 25)) * fold);
      if (restoring && Math.abs(x) < 0.35 && Math.abs(y) < 0.35 && fold < 0.001) { onDone(); return; }
      frame = requestAnimationFrame(render);
    };
    (async () => {
      if (grab.released) { onDone(); return; }
      const texture = image instanceof HTMLImageElement ? captureImage(image) : await capturePage(image);
      const { createPaperSurface } = await loadSurface();
      surface = await createPaperSurface({ canvas, texture, width: image.clientWidth, height: image.clientHeight, centerX: rect.x + rect.width / 2, centerY: rect.y + rect.height / 2, rotation, grip: { x: grab.startX, y: grab.startY }, signal: abort.signal });
      if (abort.signal.aborted) { surface.dispose(); return; }
      if (grab.released) { onDone(); return; }
      image.style.opacity = "0";
      canvas.dataset.ready = "true";
      frame = requestAnimationFrame(render);
    })().catch(error => {
      if (!abort.signal.aborted) { console.warn("Paper interaction unavailable; keeping the original image.", error); onDone(); }
    });
    const contextLost = (event: Event) => { event.preventDefault(); onDone(); };
    canvas.addEventListener("webglcontextlost", contextLost);
    return () => {
      abort.abort(); cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", contextLost);
      surface?.dispose(); image.style.opacity = oldOpacity;
      delete image.dataset.paperGrabbed;
    };
  }, [grab, onDone]);
  return createPortal(<canvas ref={canvasRef} className="paper-drag-canvas" aria-hidden="true" />, document.body);
}

export function PaperPlayProvider({ children, onBusyChange }: { children: ReactNode; onBusyChange?: (busy: boolean) => void }) {
  const [active, setActive] = useState<Grab | null>(null);
  const grabRef = useRef<Grab | null>(null);
  const suppress = useRef(new WeakSet<HTMLElement>());
  const finish = useCallback(() => { grabRef.current = null; setActive(null); }, []);
  const activate = useCallback((grab: Grab) => {
    if (grabRef.current !== grab || grab.released || grab.active) return;
    grab.active = true; clearTimeout(grab.timer);
    suppress.current.add(grab.image);
    grab.image.dataset.paperGrabbed = "true";
    setActive(grab);
  }, []);
  const begin = useCallback((image: HTMLElement, x: number, y: number, pointer: number) => {
    if (grabRef.current || (image instanceof HTMLImageElement && (!image.complete || !image.naturalWidth))) return;
    const grab: Grab = { image, startX: x, startY: y, x, y, pointer, active: false, released: false, instant: false };
    grabRef.current = grab;
    void loadSurface();
    if (pointer < 0) activate(grab);
    else {
      image.setPointerCapture(pointer);
      grab.timer = setTimeout(() => activate(grab), 180);
    }
  }, [activate]);
  useEffect(() => {
    onBusyChange?.(active !== null);
    document.body.toggleAttribute("data-paper-grabbing", active !== null);
    return () => document.body.removeAttribute("data-paper-grabbing");
  }, [active, onBusyChange]);
  useEffect(() => {
    const release = (instant = false) => {
      const grab = grabRef.current;
      if (!grab) return;
      clearTimeout(grab.timer); grab.released = true; grab.instant = instant;
      if (grab.pointer >= 0 && grab.image.hasPointerCapture(grab.pointer)) grab.image.releasePointerCapture(grab.pointer);
      if (!grab.active) grabRef.current = null;
      setTimeout(() => suppress.current.delete(grab.image), 600);
    };
    const move = (event: PointerEvent) => {
      const grab = grabRef.current;
      if (!grab || grab.released || event.pointerId !== grab.pointer) return;
      grab.x = event.clientX; grab.y = event.clientY;
      if (Math.hypot(grab.x - grab.startX, grab.y - grab.startY) > 6) activate(grab);
      if (grab.active) event.preventDefault();
    };
    const up = (event: PointerEvent) => { if (grabRef.current?.pointer === event.pointerId) release(); };
    const cancel = () => release(true);
    const keyDown = (event: KeyboardEvent) => {
      const grab = grabRef.current;
      if (!grab?.active || grab.released) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); release(true); }
      if (grab.pointer < 0 && event.key.startsWith("Arrow")) {
        event.preventDefault(); event.stopImmediatePropagation();
        const step = event.shiftKey ? 35 : 15;
        grab.x += event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0;
        grab.y += event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0;
      }
    };
    const keyUp = (event: KeyboardEvent) => {
      if (grabRef.current?.pointer === -1 && (event.key === " " || event.key === "Enter")) { event.preventDefault(); release(); }
    };
    const visibility = () => { if (document.hidden) cancel(); };
    const nativeDrag = (event: DragEvent) => {
      if (event.target instanceof Element && event.target.closest('[data-paper-image], [data-paper-card], .lanyard')) event.preventDefault();
    };
    document.addEventListener("dragstart", nativeDrag, true);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up); window.addEventListener("pointercancel", cancel);
    window.addEventListener("blur", cancel); window.addEventListener("resize", cancel);
    window.addEventListener("keydown", keyDown, true); window.addEventListener("keyup", keyUp, true);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearTimeout(grabRef.current?.timer);
      document.removeEventListener("dragstart", nativeDrag, true);
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("blur", cancel); window.removeEventListener("resize", cancel);
      window.removeEventListener("keydown", keyDown, true); window.removeEventListener("keyup", keyUp, true);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [activate]);
  return <PaperContext.Provider value={{ begin, suppressClick: image => { const blocked = suppress.current.has(image) || image.dataset.paperGrabbed === "true"; suppress.current.delete(image); return blocked; } }}>
    {children}
    {active && <DraggedPaper grab={active} onDone={finish} />}
  </PaperContext.Provider>;
}

export function PaperImage({ label, interactive = true, ...props }: ImgHTMLAttributes<HTMLImageElement> & { label?: string; interactive?: boolean }) {
  const paper = useContext(PaperContext);
  return <img {...props} draggable={false} data-paper-image="true" role={label ? "button" : undefined} tabIndex={label ? 0 : undefined}
    aria-label={label ? `${label}. Hold to crumple and drag; release to return. Keyboard: hold Space, use arrow keys, then release.` : undefined}
    onPointerEnter={() => { void loadSurface(); }}
    onDragStart={event => event.preventDefault()}
    onPointerDown={event => {
      if (interactive && event.isPrimary && event.button === 0) {
        event.preventDefault();
        if (label) event.currentTarget.focus({ preventScroll: true });
        paper?.begin(event.currentTarget, event.clientX, event.clientY, event.pointerId);
      }
    }}
    onClickCapture={event => { if (paper?.suppressClick(event.currentTarget)) { event.preventDefault(); event.stopPropagation(); } }}
    onKeyDown={event => {
      if (label && !event.repeat && (event.key === " " || event.key === "Enter")) {
        event.preventDefault(); event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        paper?.begin(event.currentTarget, rect.x + rect.width / 2, rect.y + rect.height / 2, -1);
      }
    }} />;
}


export function PaperCard(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const paper = useContext(PaperContext);
  return <button {...props} draggable={false} data-paper-card="true"
    onDragStart={event => event.preventDefault()}
    onPointerEnter={() => { void loadSurface(); }}
    onPointerDown={event => {
      if (event.isPrimary && event.button === 0) {
        event.preventDefault();
        event.currentTarget.focus({ preventScroll: true });
        paper?.begin(event.currentTarget, event.clientX, event.clientY, event.pointerId);
      }
    }}
    onClickCapture={event => { if (paper?.suppressClick(event.currentTarget)) { event.preventDefault(); event.stopPropagation(); } }}
    onKeyDown={event => {
      if (event.altKey && event.key === " " && !event.repeat) {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        paper?.begin(event.currentTarget, rect.x + rect.width / 2, rect.y + rect.height / 2, -1);
      }
    }} />;
}
