"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import HoloCard from "./holo-card";
import { PaperImage, PaperCard } from "./paper-play";
import { capturePage } from "@/lib/paper/capture";
import type { PaperSurface } from "@/lib/paper/paper-surface";
import { X } from "lucide-react";

const cards = [
  { id: "music", title: "Music", suit: "♠", accent: "#29435b", stock: "#b7c8d4" },
  { id: "projects", title: "Projects", suit: "♦", accent: "#743c2c", stock: "#dfb49b" },
  { id: "experience", title: "Experience", suit: "♣", accent: "#57472c", stock: "#d8c397" },
  { id: "inspiration", title: "Inspiration", suit: "♥", accent: "#604351", stock: "#d0b4ba" },
  { id: "about-me", title: "About Me", suit: "♠", accent: "#3f523a", stock: "#bcc8ac" },
] as const;

type CollectionCard = (typeof cards)[number];
type ChapterModule = typeof import("./chapter-pages");
type Selection = { index: number; trigger: HTMLButtonElement; travel: HTMLDivElement; Face: ChapterModule["ChapterFace"] };

// Chapter content and its animation libraries stay out of the first load.
let chapterModule: Promise<ChapterModule> | undefined;
function loadChapters() {
  return chapterModule ??= import("./chapter-pages").catch((error) => {
    chapterModule = undefined;
    throw error;
  });
}

// Match the scraps' crawl: scoot, hold, sidestep, hold, then settle.
const cardScoot: Keyframe[] = [
  { offset: 0, transform: "translate(0, 0)" },
  { offset: 0.12, transform: "translate(0, 0)" },
  { offset: 0.3, transform: "translate(12px, 30%)" },
  { offset: 0.4, transform: "translate(12px, 30%)" },
  { offset: 0.56, transform: "translate(-10px, 30%)" },
  { offset: 0.66, transform: "translate(-10px, 30%)" },
  { offset: 0.84, transform: "translate(-10px, 68%)" },
  { offset: 0.92, transform: "translate(-10px, 68%)" },
  { offset: 1, transform: "translate(0, calc(100% + 48px))" },
];
const cardDuration = 460;
const paperFallDuration = 1250;
const cardCrumpleDuration = 720;
const paperRiseDuration = 720;
const paperUnfoldDuration = 1050;
type PaperPose = { fold: number; x: number; y: number; tilt: number; scale: number; rotation: number };
const clampProgress = (value: number) => Math.max(0, Math.min(1, value));
const smoothProgress = (value: number) => {
  const t = clampProgress(value);
  return t * t * (3 - 2 * t);
};

function subscribeToReducedMotion(update: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}
const getReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getServerReducedMotion = () => true;

function CardFace({ card, index }: { card: CollectionCard; index: number }) {
  return (
    <>
      <span className="card-heading">
        <span className="card-rank" aria-hidden="true">
          {index + 1}<small>{card.suit}</small>
        </span>
        <span className="card-title">{card.title}</span>
      </span>
      <span className="card-window">
        <PaperImage
          interactive={false}
          className="card-world-art"
          src={`/images/card-worlds/${card.id}.webp`}
          alt=""
          width="768"
          height="1024"
          decoding="async"
          draggable="false"
        />
      </span>
      <span className="card-corner" aria-hidden="true">
        {index + 1}<small>{card.suit}</small>
      </span>
    </>
  );
}

function ChapterPage({ selection, reducedMotion, onClose }: {
  selection: Selection;
  reducedMotion: boolean;
  onClose: () => void;
}) {
  const { index, trigger, travel, Face } = selection;
  const card = cards[index];
  const dialogRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardCanvasRef = useRef<HTMLCanvasElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(() => {});
  const [live, setLive] = useState(false);
  const settleRef = useRef(() => {});

  useLayoutEffect(() => {
    const dialog = dialogRef.current, page = pageRef.current, veil = veilRef.current;
    const canvas = canvasRef.current, cardCanvas = cardCanvasRef.current;
    if (!dialog || !page || !veil || !canvas || !cardCanvas) return;
    const abort = new AbortController();
    const oldVisibility = travel.style.visibility;
    let surface: PaperSurface | undefined, cardSurface: PaperSurface | undefined;
    let frame = 0, previous = 0, elapsed = 0;
    let closing = false, settled = false, returned = false;
    let stage: "preparing" | "card-crumpling" | "rising" | "uncrumpling" | "open" = "preparing";
    let pagePose: PaperPose = { fold: 0.985, x: 0, y: 0, tilt: 0, scale: 1, rotation: 0 };
    let fall: { elapsed: number; from: PaperPose; veil: number; targetX: number; targetY: number; scale: number; direction: number } | undefined;
    let cardOrigin = { x: 0, y: 0 };
    const slot = travel.closest(".collection-slot")?.getBoundingClientRect();
    const slotWidth = slot?.width ?? trigger.offsetWidth;
    const slotX = slot ? slot.left + slot.width / 2 : innerWidth / 2;
    const launch = {
      x: slotX - innerWidth / 2,
      y: innerHeight / 2 + slotWidth * 0.65,
      scale: Math.min(0.48, Math.max(0.12, slotWidth / page.clientWidth * 1.6)),
      direction: slotX < innerWidth / 2 ? -1 : 1,
    };
    const centerScale = Math.min(0.6, Math.max(0.38, launch.scale * 1.3));
    // This animation is reserved for the card's return. Opening uses real paper.
    const cardAnimation = travel.animate(cardScoot.map(keyframe => ({ ...keyframe, easing: "steps(2, end)" })), { duration: cardDuration, fill: "both" });
    cardAnimation.pause();
    cardAnimation.currentTime = 0;
    dialog.dataset.phase = "preparing";
    const renderPage = (pose: PaperPose) => {
      pagePose = pose;
      surface?.render(pose.fold, pose.x, pose.y, pose.tilt, { scale: pose.scale, rotation: pose.rotation });
    };
    const disposeCard = () => {
      cardCanvas.style.visibility = "hidden";
      cardCanvas.removeEventListener("webglcontextlost", contextLost);
      cardSurface?.dispose(); cardSurface = undefined;
    };
    const parkCard = () => {
      travel.style.visibility = "hidden";
      cardAnimation.finish();
    };
    const showPage = () => {
      if (abort.signal.aborted || closing) return;
      stage = "open";
      pagePose = { fold: 0, x: 0, y: 0, tilt: 0, scale: 1, rotation: 0 };
      parkCard();
      disposeCard();
      page.style.opacity = "1";
      canvas.style.visibility = "hidden";
      veil.style.opacity = "1";
      dialog.dataset.phase = "open";
      setLive(true);
      closeButtonRef.current?.focus({ preventScroll: true });
    };
    const returnCard = () => {
      if (returned || abort.signal.aborted) return;
      returned = true;
      disposeCard();
      page.style.opacity = "0";
      canvas.style.visibility = "hidden";
      veil.style.opacity = "0";
      travel.style.visibility = oldVisibility;
      dialog.dataset.phase = "returning";
      if (getReducedMotion() || Number(cardAnimation.currentTime ?? 0) <= 0) { onClose(); return; }
      cardAnimation.playbackRate = -1.1;
      cardAnimation.play();
      cardAnimation.finished.then(() => { if (!abort.signal.aborted) onClose(); }).catch(() => {});
    };
    const render = (now: number) => {
      if (abort.signal.aborted || settled) return;
      const dt = previous ? Math.min(40, now - previous) : 16;
      previous = now;
      elapsed += dt;
      if (closing && fall) {
        fall.elapsed += dt;
        const progress = clampProgress(fall.elapsed / paperFallDuration);
        const crumple = smoothProgress(progress / 0.58);
        const drop = clampProgress((progress - 0.14) / 0.86);
        const gravity = drop * drop;
        const shrink = smoothProgress((progress - 0.18) / 0.7);
        renderPage({
          fold: fall.from.fold + (0.985 - fall.from.fold) * crumple,
          x: fall.from.x + (fall.targetX - fall.from.x) * smoothProgress(drop),
          y: fall.from.y + (fall.targetY - fall.from.y) * gravity - Math.sin(Math.PI * drop) * 18,
          tilt: fall.from.tilt * (1 - drop) + fall.direction * (Math.sin(Math.PI * drop) * 16 + drop * 8),
          scale: fall.from.scale + (fall.scale - fall.from.scale) * shrink,
          rotation: fall.from.rotation * (1 - drop) + fall.direction * (4 * smoothProgress(progress / 0.4) + 24 * drop ** 1.2),
        });
        veil.style.opacity = String(fall.veil * (1 - smoothProgress(progress / 0.7)));
        if (progress === 1) { returnCard(); return; }
      } else if (stage === "card-crumpling") {
        const progress = clampProgress(elapsed / cardCrumpleDuration);
        const crumple = smoothProgress(progress / 0.6);
        const drop = clampProgress((progress - 0.3) / 0.7);
        cardSurface?.render(
          0.985 * crumple,
          (slotX - cardOrigin.x) * smoothProgress(drop) + Math.sin(Math.PI * drop) * launch.direction * 10,
          (innerHeight + slotWidth * 0.65 - cardOrigin.y) * drop * drop - Math.sin(Math.PI * crumple) * 8,
          launch.direction * (Math.sin(Math.PI * drop) * 16 + drop * 8),
          { scale: 1 - 0.12 * smoothProgress(progress), rotation: launch.direction * 28 * drop },
        );
        veil.style.opacity = String(0.1 * smoothProgress(progress));
        if (progress === 1) {
          disposeCard();
          if (closing) { returnCard(); return; }
          stage = "rising"; elapsed = 0;
          dialog.dataset.phase = stage;
          renderPage({ fold: 0.985, x: launch.x, y: launch.y, scale: launch.scale, tilt: launch.direction * 18, rotation: launch.direction * -28 });
          canvas.style.visibility = "visible";
        }
      } else if (stage === "rising") {
        const progress = clampProgress(elapsed / paperRiseDuration);
        const rise = 1 - (1 - progress) ** 3;
        const drift = smoothProgress(progress);
        renderPage({
          fold: 0.985,
          x: launch.x * (1 - drift),
          y: launch.y * (1 - rise),
          tilt: launch.direction * (18 * (1 - progress) + Math.sin(Math.PI * progress) * 12),
          scale: launch.scale + (centerScale - launch.scale) * drift,
          rotation: launch.direction * -28 * (1 - drift),
        });
        veil.style.opacity = String(0.1 + 0.35 * drift);
        if (progress === 1) {
          stage = "uncrumpling"; elapsed = 0;
          dialog.dataset.phase = stage;
        }
      } else if (stage === "uncrumpling") {
        const progress = clampProgress(elapsed / paperUnfoldDuration);
        const unfold = smoothProgress(progress);
        renderPage({ fold: 0.985 * (1 - unfold), x: 0, y: 0, tilt: 0, scale: centerScale + (1 - centerScale) * unfold, rotation: 0 });
        veil.style.opacity = String(0.45 + unfold * 0.55);
        if (progress === 1) { showPage(); return; }
      }
      frame = requestAnimationFrame(render);
    };
    const settle = () => {
      if (abort.signal.aborted) return;
      settled = true;
      cancelAnimationFrame(frame);
      if (closing) { onClose(); return; }
      showPage();
      surface?.dispose(); surface = undefined;
    };
    const contextLost = (event: Event) => { event.preventDefault(); if (!settled) settle(); };
    settleRef.current = settle;
    closeRef.current = () => {
      if (closing || abort.signal.aborted) return;
      closing = true;
      dialog.dataset.phase = "closing";
      dialog.focus({ preventScroll: true });
      if (getReducedMotion()) { onClose(); return; }
      if (stage === "preparing" || settled) { returnCard(); return; }
      // Finish a picked-up card's drop before returning it if Escape interrupts.
      if (stage === "card-crumpling") return;
      if (!surface) { returnCard(); return; }
      fall = {
        elapsed: 0,
        from: { ...pagePose },
        veil: Number(veil.style.opacity) || 0,
        targetX: launch.x,
        targetY: launch.y,
        scale: launch.scale,
        direction: launch.direction,
      };
      renderPage(pagePose);
      page.style.opacity = "0";
      canvas.style.visibility = "visible";
      cancelAnimationFrame(frame); previous = 0;
      frame = requestAnimationFrame(render);
    };
    canvas.addEventListener("webglcontextlost", contextLost);
    cardCanvas.addEventListener("webglcontextlost", contextLost);
    window.addEventListener("resize", settle);
    if (getReducedMotion()) settle();
    else (async () => {
      const [texture, cardTexture, { createPaperSurface }] = await Promise.all([
        capturePage(page), capturePage(trigger), import("@/lib/paper/paper-surface"),
      ]);
      if (abort.signal.aborted || settled || closing) return;
      // Let the existing hover/focus lift finish before replacing the card with
      // its textured mesh, so the handoff has the same position and rotation.
      const lift = trigger.closest(".collection-lift");
      await Promise.all((lift?.getAnimations() ?? []).filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
      if (abort.signal.aborted || settled || closing) return;
      const rect = trigger.getBoundingClientRect();
      cardOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      let rotation = 0;
      for (let node: HTMLElement | null = trigger; node; node = node.parentElement) {
        const css = getComputedStyle(node);
        if (css.transform !== "none") { const matrix = new DOMMatrix(css.transform); rotation += Math.atan2(matrix.b, matrix.a) * 180 / Math.PI; }
        if (css.rotate !== "none") rotation += parseFloat(css.rotate) || 0;
      }
      await Promise.all([
        createPaperSurface({ canvas, texture, width: page.clientWidth, height: page.clientHeight, stock: card.stock, signal: abort.signal }).then(prepared => {
          if (abort.signal.aborted || settled || closing) { prepared.dispose(); return; }
          surface = prepared;
        }),
        createPaperSurface({ canvas: cardCanvas, texture: cardTexture, width: trigger.clientWidth, height: trigger.clientHeight, centerX: cardOrigin.x, centerY: cardOrigin.y, rotation, stock: card.stock, signal: abort.signal }).then(prepared => {
          if (abort.signal.aborted || settled || closing) { prepared.dispose(); return; }
          cardSurface = prepared;
        }),
      ]);
      if (abort.signal.aborted || settled || closing || !surface || !cardSurface) return;
      cardSurface.render(0);
      cardCanvas.style.visibility = "visible";
      parkCard();
      stage = "card-crumpling";
      dialog.dataset.phase = stage;
      frame = requestAnimationFrame(render);
    })().catch(error => {
      if (!abort.signal.aborted && !closing) {
        console.warn("Paper entrance unavailable; showing the chapter directly.", error);
        settle();
      }
    });
    return () => {
      abort.abort(); cancelAnimationFrame(frame); cardAnimation.cancel();
      canvas.removeEventListener("webglcontextlost", contextLost);
      cardCanvas.removeEventListener("webglcontextlost", contextLost);
      window.removeEventListener("resize", settle);
      surface?.dispose(); cardSurface?.dispose();
      travel.style.visibility = oldVisibility;
      closeRef.current = () => {}; settleRef.current = () => {};
    };
  }, [onClose, travel, trigger, card.stock]);

  useLayoutEffect(() => {
    if (reducedMotion) settleRef.current();
  }, [reducedMotion]);

  return (
    <>
      <Dialog.Overlay forceMount asChild>
        <div ref={veilRef} className="card-dialog-veil" />
      </Dialog.Overlay>
      <Dialog.Content
        forceMount
        asChild
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          const target = dialogRef.current?.dataset.phase === "open" ? closeButtonRef.current : dialogRef.current;
          target?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.focus({ preventScroll: true });
        }}
        onEscapeKeyDown={(event) => { event.preventDefault(); closeRef.current(); }}
        onInteractOutside={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === "Tab" && dialogRef.current?.dataset.phase !== "open") event.preventDefault();
        }}
      >
        <div ref={dialogRef} id="expanded-collection-card" className="card-dialog-root" tabIndex={-1}>
          <canvas ref={cardCanvasRef} className="paper-page-canvas paper-card-canvas" aria-hidden="true" />
          <canvas ref={canvasRef} className="paper-page-canvas paper-chapter-canvas" aria-hidden="true" />
          <div
            ref={pageRef}
            className="expanded-card card-page-panel"
            style={{ "--card-accent": card.accent, "--card-stock": card.stock } as CSSProperties}
          >
            <Face card={card} index={index} live={live} />
            <button
              ref={closeButtonRef}
              type="button"
              className="card-dialog-close"
              aria-label={`Close ${card.title} card`}
              onClick={() => closeRef.current()}
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </Dialog.Content>
    </>
  );
}

export function CollectionCardStack({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const reducedMotion = useSyncExternalStore(subscribeToReducedMotion, getReducedMotion, getServerReducedMotion);
  const instructionsId = useId();
  const close = useCallback(() => setSelection(null), []);

  useEffect(() => {
    onOpenChange?.(selection !== null);
  }, [selection, onOpenChange]);

  useEffect(() => {
    const timer = setTimeout(() => { loadChapters().catch(() => {}); }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const openChapter = (index: number, trigger: HTMLButtonElement) => {
    const travel = trigger.closest(".card-travel") as HTMLDivElement;
    loadChapters()
      .then(({ ChapterFace }) => setSelection({ index, trigger, travel, Face: ChapterFace }))
      .catch((error) => console.warn("Chapter could not load.", error));
  };

  return (
    <Dialog.Root open={selection !== null}>
      <section className="collection" aria-label="A few worlds to explore">
        <p className="sr-only" id={instructionsId}>
          Hover or focus to lift a card. Click, tap, or press Enter to open its
          chapter. Drag the whole card to play with it, then release to return. Keyboard: hold Alt and Space, use arrow keys, then release. Use the close button or Escape to return to the collection.
        </p>
        <ol className="collection-deck" aria-label="Explore Jo's collection">
          {cards.map((card, index) => {
            const distance = index - 2;
            const style = {
              "--card-index": index,
              "--card-angle": `${distance * 2.3}deg`,
              "--card-layer": 5 - Math.abs(distance),
              "--card-drop": `${Math.round(24 * (1 - Math.exp(-(distance ** 2) / 1.6)))}px`,
              "--card-accent": card.accent,
              "--card-stock": card.stock,
              "--card-delay": `${index * 80}ms`,
            } as CSSProperties;
            return (
              <li
                key={card.id}
                className="collection-slot"
                style={style}
                data-selected={selection?.index === index}
                onPointerEnter={() => { loadChapters().catch(() => {}); }}
                onFocus={() => { loadChapters().catch(() => {}); }}
              >
                <div className="card-travel">
                  <div className="collection-lift">
                  <HoloCard className="collection-holo" style={{ width: "100%", height: "100%" }} preset="gold" intensity={0.36} edgeSparkle={0.25} glare={0.12} tiltMax={8} hoverScale={1.015} radius={11} shadow={false} idle={false} enabled={!selection}>
                  <PaperCard
                    type="button"
                    className="collection-card"
                    aria-label={`Explore ${card.title}`}
                    aria-haspopup="dialog"
                    aria-expanded={selection?.index === index}
                    aria-controls={selection?.index === index ? "expanded-collection-card" : undefined}
                    aria-describedby={instructionsId}
                    onClick={(event) => openChapter(index, event.currentTarget)}
                  >
                    <CardFace card={card} index={index} />
                  </PaperCard>
                  </HoloCard>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
      {selection && (
        <Dialog.Portal forceMount>
          <ChapterPage selection={selection} reducedMotion={reducedMotion} onClose={close} />
        </Dialog.Portal>
      )}
    </Dialog.Root>
  );
}
