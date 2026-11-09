"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Deal, Figures, prefersReducedMotion, stockVars, Tools, TornBacking } from "./chapter-bits";
import ClickSpark from "./click-spark";
import FoldText from "./fold-text";
import { PaperImage } from "./paper-play";
import type { Entry, Plate as PlateData, Story } from "@/lib/chapter-details";

const confetti = ["#c9663f", "#e2b04a", "#29435b", "#8b4a5e", "#5c7a52"];
const openEase = "cubic-bezier(0.22, 1, 0.36, 1)";
const closeEase = "cubic-bezier(0.55, 0, 0.8, 0.3)";

const pad = (value: number) => String(value).padStart(2, "0");
const findTrigger = (slug: string) => document.querySelector<HTMLElement>(`[data-entry="${slug}"]`);

/** A clip that shows only the part of the screen the sheet was sitting on. */
function clipTo(box: DOMRect) {
  const side = (value: number) => `${Math.max(0, value)}px`;
  return `inset(${side(box.top)} ${side(innerWidth - box.right)} ${side(innerHeight - box.bottom)} ${side(box.left)} round 6px)`;
}
const fullClip = "inset(0px 0px 0px 0px round 0px)";

/** Moves `target`, measured in place, onto `from` with a transform. */
function flyFrom(from: DOMRect, target: DOMRect) {
  const scale = from.width / target.width;
  return `translate(${from.left - target.left}px, ${from.top - target.top}px) scale(${scale})`;
}

function PlaceholderTag({ children = "placeholder" }: { children?: ReactNode }) {
  return <span className="placeholder-tag">{children}</span>;
}

function Plate({ plate, className = "", eager = false }: { plate: PlateData; className?: string; eager?: boolean }) {
  return (
    <figure className={`detail-plate ${className}`}>
      <span className="tape" aria-hidden="true" />
      <span className="detail-plate-frame">
        <PaperImage src={plate.src} alt={plate.alt} width="1500" height="1000" loading={eager ? "eager" : "lazy"} decoding="async" />
      </span>
      <figcaption>
        {plate.placeholder && <PlaceholderTag>placeholder art</PlaceholderTag>}
        <span>{plate.caption}</span>
      </figcaption>
    </figure>
  );
}

function StoryCopy({ story }: { story: Story }) {
  return (
    <>
      <h3 className="detail-heading">
        {story.heading}
        {story.placeholder && <PlaceholderTag />}
      </h3>
      {story.body.map(paragraph => <p className="detail-copy" data-placeholder={story.placeholder || undefined} key={paragraph}>{paragraph}</p>)}
    </>
  );
}

function DetailPage({ entry, index, total, next, onNext }: {
  entry: Entry;
  index: number;
  total: number;
  next: Entry;
  onNext: () => void;
}) {
  return (
    <>
      <div className="detail-hero">
        <span className="detail-number" aria-hidden="true">{pad(index + 1)}</span>
        <div className="detail-intro">
          <p className="detail-home">{entry.home}</p>
          <Dialog.Title className="detail-title" tabIndex={-1}>
            <FoldText text={entry.name} trigger="mount" hoverRefold splitBy="char" fontSize="inherit" fontWeight="inherit" duration={0.6} stagger={0.016} refoldAngle={50} refoldRadius={110} creaseShading={0.4} />
          </Dialog.Title>
          {(entry.when || entry.where) && (
            <p className="detail-when">{[entry.when, entry.where].filter(Boolean).join("  ·  ")}</p>
          )}
          <Dialog.Description className="detail-summary">{entry.summary}</Dialog.Description>
          <Tools tools={entry.tools} />
        </div>
        <Plate plate={entry.hero} className="detail-hero-plate" eager />
      </div>

      {!!entry.stats?.length && (
        <Deal order={2} kind="slide" className="detail-band">
          <TornBacking seed={entry.slug.length * 31 + 7} depth={9} across={80} down={10} className="detail-band-paper" />
          <Figures stats={entry.stats} delay={0.35} />
        </Deal>
      )}

      <div className="detail-rows">
        <section className="detail-row">
          <Deal order={3} kind="slide" className="detail-row-copy">
            <h3 className="detail-heading">{entry.pointsHeading}</h3>
            <ol className="detail-points">
              {entry.points.map(point => <li key={point}>{point}</li>)}
            </ol>
          </Deal>
          <Deal order={4} kind="slap"><Plate plate={entry.gallery[0]} /></Deal>
        </section>
        <section className="detail-row">
          <Deal order={3} kind="slide" className="detail-row-copy"><StoryCopy story={entry.stories[0]} /></Deal>
          <Deal order={4} kind="slap"><Plate plate={entry.gallery[1]} /></Deal>
        </section>
      </div>

      <section className="detail-slip">
        <TornBacking seed={entry.slug.length * 13 + 211} depth={5} across={50} down={14} className="detail-slip-paper" />
        <span className="tape" aria-hidden="true" />
        <StoryCopy story={entry.stories[1]} />
      </section>

      <button type="button" className="detail-next" onClick={onNext}>
        <TornBacking seed={entry.slug.length * 7 + 5} depth={7} across={70} down={18} className="detail-next-paper" />
        <span className="detail-next-copy">
          <span className="detail-next-label">{index + 1 === total ? "Back to the first one" : "Next one"}</span>
          <span className="detail-next-name">{next.name}<ArrowRight aria-hidden="true" size="0.8em" strokeWidth={1.5} /></span>
        </span>
        <img src={next.hero.src} alt="" width="1500" height="1000" loading="lazy" decoding="async" />
      </button>
    </>
  );
}

// A full-screen page grown out of the sheet that was clicked. It is a nested
// Radix dialog, so Escape closes this page and leaves the chapter underneath
// open, focus stays inside it, and the overlay takes over the scroll lock.
function EntryDetail({ entries, index, backTo, onIndex, onClose }: {
  entries: Entry[];
  index: number;
  backTo: string;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const entry = entries[index];
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const slugRef = useRef(entry.slug);
  const entered = useRef(false);
  const entrance = useRef<Animation[]>([]);
  const closing = useRef(false);
  const [turn, setTurn] = useState(0);
  slugRef.current = entry.slug;

  // Runs from the ref because Radix's portal mounts a commit after this component.
  const attach = useCallback((root: HTMLDivElement | null) => {
    rootRef.current = root;
    if (!root || entered.current) return;
    entered.current = true;
    const trigger = findTrigger(slugRef.current);
    if (!trigger || prefersReducedMotion()) return;
    const timing = { duration: 560, easing: openEase };
    entrance.current.push(root.animate({ clipPath: [clipTo(trigger.getBoundingClientRect()), fullClip] }, timing));
    const from = trigger.querySelector("img")?.getBoundingClientRect();
    const plate = root.querySelector<HTMLElement>(".detail-hero-plate .detail-plate-frame");
    if (from && plate) {
      plate.style.transformOrigin = "0 0";
      entrance.current.push(plate.animate({ transform: [flyFrom(from, plate.getBoundingClientRect()), "none"] }, timing));
    }
  }, []);

  const close = useCallback(() => {
    const root = rootRef.current;
    if (closing.current) return;
    closing.current = true;
    const trigger = findTrigger(slugRef.current);
    // After paging, the current entry's sheet may be scrolled away underneath.
    trigger?.scrollIntoView({ block: "nearest" });
    if (!root || !trigger || prefersReducedMotion()) { onClose(); return; }
    entrance.current.forEach(animation => animation.cancel());
    const timing = { duration: 300, easing: closeEase, fill: "forwards" as const };
    const shrink = root.animate({ clipPath: [fullClip, clipTo(trigger.getBoundingClientRect())] }, timing);
    veilRef.current?.animate({ opacity: [1, 0] }, timing);
    shrink.finished.then(onClose, onClose);
  }, [onClose]);

  const go = useCallback((target: number) => {
    onIndex((target + entries.length) % entries.length);
    setTurn(value => value + 1);
  }, [entries.length, onIndex]);

  // A new page: start at its top, and tell screen readers by moving focus to its name.
  useEffect(() => {
    if (!turn) return;
    scrollRef.current?.scrollTo({ top: 0 });
    rootRef.current?.querySelector<HTMLElement>(".detail-title")?.focus({ preventScroll: true });
  }, [turn]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") go(index + 1);
    if (event.key === "ArrowLeft") go(index - 1);
  };

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) close(); }}>
      <Dialog.Portal>
        <Dialog.Overlay ref={veilRef} className="detail-veil" />
        <Dialog.Content
          ref={attach}
          className="detail"
          style={stockVars(index)}
          onOpenAutoFocus={event => { event.preventDefault(); backRef.current?.focus({ preventScroll: true }); }}
          onCloseAutoFocus={event => { event.preventDefault(); findTrigger(slugRef.current)?.focus({ preventScroll: true }); }}
          onInteractOutside={event => event.preventDefault()}
          onKeyDown={onKeyDown}
        >
          <ClickSpark sparkColor={confetti} shape="star" sparkCount={12} sparkSize={13} sparkRadius={56} gravity={0.7} randomness={0.6} duration={620}>
            <div className="detail-scroll" ref={scrollRef}>
              <div className="detail-bar">
                <button type="button" className="detail-back" ref={backRef} onClick={close}>
                  <ArrowLeft aria-hidden="true" size={18} strokeWidth={1.75} />
                  Back to {backTo}
                </button>
                <div className="detail-pager">
                  <button type="button" aria-label="Previous" onClick={() => go(index - 1)}><ArrowLeft aria-hidden="true" size={18} strokeWidth={1.75} /></button>
                  <span>{pad(index + 1)} / {pad(entries.length)}</span>
                  <button type="button" aria-label="Next" onClick={() => go(index + 1)}><ArrowRight aria-hidden="true" size={18} strokeWidth={1.75} /></button>
                </div>
              </div>
              <div className="detail-clip">
                <div className="detail-page" key={entry.slug} data-turned={turn > 0 || undefined}>
                  <DetailPage entry={entry} index={index} total={entries.length} next={entries[(index + 1) % entries.length]} onNext={() => go(index + 1)} />
                </div>
              </div>
            </div>
          </ClickSpark>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function useEntryDetail(entries: Entry[], backTo: string) {
  const [index, setIndex] = useState<number | null>(null);
  const close = useCallback(() => setIndex(null), []);
  return {
    open: setIndex as (index: number) => void,
    node: index === null ? null : <EntryDetail entries={entries} index={index} backTo={backTo} onIndex={setIndex} onClose={close} />,
  };
}
