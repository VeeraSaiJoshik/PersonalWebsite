"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BorderBeam } from "border-beam";
import { Liquid } from "liquid-gooey";
import CircularText from "./circular-text";
import ClickSpark from "./click-spark";
import CountUp from "./count-up";
import FallingText from "./falling-text";
import FlipCard from "./flip-card";
import FoldText from "./fold-text";
import ImageTrail from "./image-trail";
import Magnet from "./magnet";
import { PaperHarmonium } from "./paper-harmonium";
import { PaperImage } from "./paper-play";
import Shredder from "./shredder";
import Stack from "./stack";
import StickerPeel from "./sticker-peel";
import TearTicket from "./tear-ticket";
import VariableProximity from "./variable-proximity";
import { tornClip } from "@/lib/paper/torn-edge";
import { about, alongside, before, chapterCopy, contact, now, pins, placeholders, projects, records, type ChapterId, type Role, type Stat } from "@/lib/chapters";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const subscribeToNarrow = (update: () => void) => {
  const media = window.matchMedia("(max-width: 760px)");
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
};
const getNarrow = () => window.matchMedia("(max-width: 760px)").matches;
const useNarrow = () => useSyncExternalStore(subscribeToNarrow, getNarrow, () => false);

const subscribeToLarge = (update: () => void) => {
  const media = window.matchMedia("(min-width: 1700px)");
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
};
const getLarge = () => window.matchMedia("(min-width: 1700px)").matches;

const paperConfetti = ["#c9663f", "#e2b04a", "#29435b", "#8b4a5e", "#5c7a52"];

function TornBacking({ seed, depth = 5, across, down, className = "" }: {
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
function Deal({ order = 0, kind = "drop", className = "", children }: { order?: number; kind?: "drop" | "slap" | "slide"; className?: string; children: ReactNode }) {
  return (
    <div className={`deal deal-${kind} ${className}`} style={{ "--deal-order": order } as CSSProperties}>
      {children}
    </div>
  );
}

function Figure({ stat, play = true, delay = 0 }: { stat: Stat; play?: boolean; delay?: number }) {
  const [reduced] = useState(prefersReducedMotion);
  return (
    <div className="figure">
      <dt className="figure-label">{stat.label}</dt>
      <dd className="figure-value">
        <span className="figure-ghost">{stat.value}</span>
        {play && !reduced && stat.count && (
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
      </dd>
    </div>
  );
}

function Figures({ stats, play, delay }: { stats?: Stat[]; play?: boolean; delay?: number }) {
  if (!stats?.length) return null;
  return <dl className="figures">{stats.map(stat => <Figure key={stat.label} stat={stat} play={play} delay={delay} />)}</dl>;
}

function Tools({ tools }: { tools?: string[] }) {
  if (!tools?.length) return null;
  return (
    <ul className="tools" aria-label="Tools">
      {tools.map(tool => <li key={tool}>{tool}</li>)}
    </ul>
  );
}

function Headline({ text, live }: { text: string; live: boolean }) {
  if (!live) return <span style={{ visibility: "hidden" }}>{text}</span>;
  return (
    <FoldText
      text={text}
      trigger="mount"
      hoverRefold
      splitBy="char"
      fontSize="inherit"
      fontWeight="inherit"
      duration={0.7}
      stagger={0.03}
      refoldAngle={55}
      refoldRadius={110}
      creaseShading={0.4}
    />
  );
}

// Card stocks from the landing deck, pale enough to carry body text.
const stocks = [
  { stock: "#ecd2c1", ink: "#5f2f21" },
  { stock: "#e8dbb9", ink: "#4a3b22" },
  { stock: "#d3dfe6", ink: "#233a4f" },
  { stock: "#e6d3d6", ink: "#533a46" },
  { stock: "#d7dfca", ink: "#35462f" },
  { stock: "#f0e4cb", ink: "#5f2f21" },
];

// Experience: a hand of six real cards. Summary on the face, the story on the back.
const hand: { role: Role; rank: string }[] = [
  { role: now[0], rank: "A" },
  { role: now[1], rank: "K" },
  { role: before[0], rank: "Q" },
  { role: before[1], rank: "J" },
  { role: alongside[0], rank: "10" },
  { role: alongside[1], rank: "9" },
];

function RoleCard({ role, rank, index, flipped, onFlip, narrow, large }: {
  role: Role;
  rank: string;
  index: number;
  flipped: boolean;
  onFlip: (next: boolean) => void;
  narrow: boolean;
  large: boolean;
}) {
  const tone = stocks[index];
  const style = { "--role-stock": tone.stock, "--role-ink": tone.ink } as CSSProperties;
  return (
    <Deal order={index} className="hand-slot">
      <FlipCard
        flipped={flipped}
        onFlipChange={onFlip}
        width={narrow ? 310 : large ? 400 : 322}
        height={narrow ? 452 : large ? 540 : 446}
        radius={12}
        background={tone.stock}
        color={tone.ink}
        tiltMax={14}
        hoverScale={1.04}
        glareOpacity={0.25}
        ariaLabel={`${role.org}. Flip for details.`}
        front={
          <div className="role-face" style={style}>
            <span className="role-rank" aria-hidden="true">{rank}<small>♣</small></span>
            <span className="role-suit" aria-hidden="true">♣</span>
            <h3 className="role-org">{role.org}</h3>
            <p className="role-title">{role.title}</p>
            <p className="role-when">{role.when}</p>
            <Figures stats={role.stats} delay={0.5 + index * 0.08} />
            <span className="role-hint" aria-hidden="true">flip me</span>
          </div>
        }
        back={
          <div className="role-face role-back" style={style}>
            <h3 className="role-back-title">{role.org}</h3>
            {role.where && <p className="role-when">{role.where}</p>}
            <ul className="role-points">
              {role.points.map(point => <li key={point}>{point}</li>)}
            </ul>
            <Tools tools={role.tools} />
          </div>
        }
      />
    </Deal>
  );
}

function ExperienceChapter() {
  const [flipped, setFlipped] = useState<boolean[]>(() => hand.map(() => false));
  const narrow = useNarrow();
  const large = useSyncExternalStore(subscribeToLarge, getLarge, () => false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const flipAll = () => {
    timers.current.forEach(clearTimeout);
    const next = !flipped.every(Boolean);
    timers.current = hand.map((_, i) => setTimeout(() => {
      setFlipped(current => current.map((value, at) => at === i ? next : value));
    }, i * 70));
  };

  return (
    <>
      <Deal order={0} kind="slide" className="hand-actions">
        <BorderBeam size="sm" colorVariant="sunset" theme="dark" strength={1} duration={4} className="flip-all-beam">
          <button type="button" className="flip-all" onClick={flipAll}>
            {flipped.every(Boolean) ? "Flip them back" : "Flip them all"}
          </button>
        </BorderBeam>
      </Deal>
      <div className="hand">
        {hand.map(({ role, rank }, i) => (
          <RoleCard
            key={role.org}
            role={role}
            rank={rank}
            index={i}
            narrow={narrow}
            large={large}
            flipped={flipped[i]}
            onFlip={next => setFlipped(current => current.map((value, at) => at === i ? next : value))}
          />
        ))}
      </div>
    </>
  );
}

// Projects: a pile of torn sheets. The top one gets thrown; the figures on the
// next one count up as it surfaces.
function ProjectsChapter() {
  const [top, setTop] = useState(0);
  const sheets = useMemo(() => projects.map((project, i) => ({ project, i, clip: tornClip(131 + i * 29, 6, 44, 30) })), []);
  return (
    <div className="throw">
      <Deal order={2} kind="slap" className="throw-stack">
        <Stack
          layout="pile"
          spread={0.7}
          visible={5}
          radius={2}
          shadow={false}
          tilt={24}
          threshold={70}
          onChange={setTop}
          cards={sheets.map(({ project, i, clip }) => (
            <article
              key={project.name}
              className="project-sheet"
              style={{ "--pile-stock": stocks[i].stock, "--pile-ink": stocks[i].ink, clipPath: clip } as CSSProperties}
            >
              <header className="project-head">
                <span className="project-number" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className="project-home">{project.home}</span>
              </header>
              <h3 className="project-name">{project.name}</h3>
              <p className="project-summary">{project.summary}</p>
              <Figures key={top === i ? "top" : "under"} stats={project.stats} play={top === i} />
              {project.points.length > 0 && (
                <ul className="project-points">
                  {project.points.map(point => <li key={point}>{point}</li>)}
                </ul>
              )}
              <Tools tools={project.tools} />
            </article>
          ))}
        />
      </Deal>
      <Deal order={4} kind="slide" className="throw-index">
        <p className="throw-count" aria-live="polite">
          <span>{String(top + 1).padStart(2, "0")}</span> of {String(projects.length).padStart(2, "0")}
        </p>
        <ol className="throw-tabs" aria-hidden="true">
          {projects.map((project, i) => (
            <li key={project.name} data-current={top === i || undefined}>{project.name}</li>
          ))}
        </ol>
        <p className="throw-keys">Keyboard: focus the pile and press an arrow key.</p>
      </Deal>
    </div>
  );
}

function ContactTicket() {
  // The ticket scales itself down to fit, so a phone gets its own proportions
  // rather than a miniature of the desktop ticket with unreadable links.
  const narrow = useNarrow();
  return (
    <div className="ticket-wrap">
      <TearTicket
        key={narrow ? "narrow" : "wide"}
        width={narrow ? 330 : 560}
        height={narrow ? 196 : 208}
        stubSize={narrow ? 64 : 118}
        radius={8}
        holes={narrow ? 10 : 11}
        holeSize={4}
        rotate={-1.5}
        tiltMax={4}
        tearAngle={16}
        background="#e2c98f"
        stubBackground="#c9663f"
        color="#3a2c14"
        ariaLabel="Tear off the stub"
        stub={<span className="ticket-stub">Tear here</span>}
      >
        <div className="ticket-face">
          <p className="ticket-kicker">Admit one conversation</p>
          <a className="ticket-link" href={`mailto:${contact.email}`}>{contact.email}</a>
          <a className="ticket-link" href={contact.linkedin} target="_blank" rel="noreferrer">{contact.linkedinLabel}</a>
          <p className="ticket-place">{contact.place}</p>
        </div>
      </TearTicket>
    </div>
  );
}

/** Draws a scalloped award seal, since Sticker Peel peels images rather than DOM. */
async function drawSticker(lines: string[], stock: string, ink: string) {
  await Promise.all([document.fonts.load('600 70px "Eczar"'), document.fonts.load('400 40px "Kalam"')]);
  const size = 720, center = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const scallop = (radius: number, bumps: number, depth: number) => {
    ctx.beginPath();
    for (let a = 0; a <= 720; a++) {
      const angle = (a / 720) * Math.PI * 2;
      const r = radius + Math.cos(angle * bumps) * depth;
      ctx.lineTo(center + Math.cos(angle) * r, center + Math.sin(angle) * r);
    }
    ctx.closePath();
  };
  scallop(338, 18, 14);
  ctx.fillStyle = "#fbf5e6";
  ctx.fill();
  scallop(308, 18, 12);
  ctx.fillStyle = stock;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(center, center, 262, 0, Math.PI * 2);
  ctx.setLineDash([3, 12]);
  ctx.lineCap = "round";
  ctx.lineWidth = 5;
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '600 60px "Eczar"';
  ctx.fillText(lines[0], center, center - 88, 450);
  ctx.font = '700 84px "Eczar"';
  ctx.fillText(lines[1], center, center, 450);
  ctx.font = '400 48px "Kalam"';
  ctx.fillText(lines[2], center, center + 92, 450);
  return canvas.toDataURL("image/png");
}

type StickerSpot = { x: number; y: number };

function Sticker({ lines, stock, ink, rotate, spot }: { lines: string[]; stock: string; ink: string; rotate: number; spot: StickerSpot }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    drawSticker(lines, stock, ink).then(url => { if (active) setSrc(url); }).catch(() => {});
    return () => { active = false; };
  }, [lines, stock, ink]);
  if (!src) return null;
  return <StickerPeel imageSrc={src} width={196} rotate={rotate} finish="gloss" peelBackHoverPct={22} peelBackActivePct={45} draggable initialPosition={spot} />;
}

// Stickers are confined to their parent, so they share a layer over the whole
// column and start above their captions. That is what lets them go anywhere.
function StickerLayer({ row }: { row: RefObject<HTMLDivElement | null> }) {
  const layer = useRef<HTMLDivElement>(null);
  const [spots, setSpots] = useState<{ key: number; at: StickerSpot[] } | null>(null);

  useEffect(() => {
    const measure = () => {
      const box = layer.current;
      const stages = row.current?.querySelectorAll<HTMLElement>(".sticker-stage");
      if (!box || !stages) return;
      // Layout offsets, because the slots are mid-entrance and their rects are
      // transformed. Stickers position themselves from the layer's center.
      const at = Array.from(stages, stage => {
        let x = stage.offsetWidth / 2, y = stage.offsetHeight / 2;
        for (let node: HTMLElement | null = stage; node && node !== box.offsetParent; node = node.offsetParent as HTMLElement | null) {
          x += node.offsetLeft;
          y += node.offsetTop;
        }
        return { x: x - box.offsetWidth / 2, y: y - box.offsetHeight / 2 };
      });
      setSpots({ key: box.offsetWidth, at });
    };
    document.fonts.ready.then(measure);
    const observer = new ResizeObserver(measure);
    if (layer.current) observer.observe(layer.current);
    return () => observer.disconnect();
  }, [row]);

  return (
    <div className="sticker-layer" ref={layer} aria-hidden="true">
      {spots && about.honors.map((honor, i) => (
        <Sticker key={`${spots.key}-${honor.title}`} lines={honor.sticker.lines} stock={honor.sticker.stock} ink={honor.sticker.ink} rotate={[-7, 5, -3][i]} spot={spots.at[i]} />
      ))}
    </div>
  );
}

function AboutChapter() {
  const stickerRow = useRef<HTMLDivElement>(null);
  return (
    <>
      <StickerLayer row={stickerRow} />
      <div className="about-lede">
        <Deal order={1} kind="slide" className="about-copy-wrap">
          <p className="about-copy">{about.paragraphs[1]}</p>
        </Deal>
        <Deal order={3} kind="slap" className="about-seal">
          <CircularText
            text={about.seal}
            size={158}
            fontSize={13}
            fontWeight={500}
            letterSpacing={1}
            spinDuration={30}
            onHover="goBonkers"
            draggable
            ring
          >
            <span className="about-seal-mark">UVA<br />2030</span>
          </CircularText>
        </Deal>
      </div>
      <section className="chapter-section">
        <Deal order={4} kind="slide"><h3 className="section-title">Honors<span className="section-hint">peel them, stick them anywhere</span></h3></Deal>
        <div className="sticker-row" ref={stickerRow}>
          {about.honors.map((honor, i) => (
            <Deal order={5 + i} kind="slap" className="sticker-slot" key={honor.title}>
              <div className="sticker-stage" />
              <h4 className="sticker-title">{honor.title}</h4>
              <p className="sticker-note">{honor.note}</p>
              <p className="sticker-when">{honor.when}</p>
            </Deal>
          ))}
        </div>
      </section>
      <section className="chapter-section">
        <h3 className="section-title">Toolkit<span className="section-hint">go on, knock it over</span></h3>
        <p className="sr-only">Languages: {about.languages.join(", ")}. Frameworks and platforms: {about.frameworks.join(", ")}.</p>
        <div className="toolkit-pile" aria-hidden="true">
          <FallingText
            text={[...about.languages, ...about.frameworks].join(" ")}
            highlightWords={about.languages}
            trigger="hover"
            variant="tiles"
            theme="light"
            gravity={1.1}
            bounciness={0.45}
            scatter={0.6}
            order="random"
            draggable
            cursorPush={0.8}
            restoreDelay={10}
            fontSize="1.02rem"
            accentColor="#c9663f"
            backgroundColor="transparent"
          />
        </div>
      </section>
      <section className="chapter-section">
        <h3 className="section-title">Education</h3>
        <div className="ledger">
          {about.education.map(row => (
            <div className="ledger-row" key={row.school}>
              <div>
                <h4 className="ledger-title">{row.school}</h4>
                <p>{row.detail}</p>
                <p>{row.extra}</p>
              </div>
              <p className="ledger-when">{row.when}<span>{row.where}</span></p>
            </div>
          ))}
        </div>
      </section>
      <section className="chapter-section">
        <h3 className="section-title">Say hello</h3>
        <ContactTicket />
      </section>
    </>
  );
}

function RecordCrate() {
  if (!records.length) return null;
  return (
    <ul className="crate">
      {records.map(record => (
        <li className="sleeve" key={`${record.title}-${record.by}`}>
          <span className="sleeve-disc" aria-hidden="true" />
          <h3 className="sleeve-title">{record.href ? <a href={record.href} target="_blank" rel="noreferrer">{record.title}</a> : record.title}</h3>
          <p className="sleeve-by">{record.by}</p>
          {record.note && <p className="sleeve-note">{record.note}</p>}
        </li>
      ))}
    </ul>
  );
}

function MusicChapter() {
  return (
    <>
      <RecordCrate />
      <PaperHarmonium />
      <Deal order={8} kind="slide" className="ask-row">
        <a className="ask-note" href={`mailto:${contact.email}`}>Ask me what's actually on repeat.</a>
      </Deal>
    </>
  );
}

const worlds = ["music", "projects", "experience", "inspiration", "about-me"];

function InspirationChapter() {
  return (
    <>
      <div className="trail-layer" aria-hidden="true">
        <ImageTrail
          items={[...worlds, ...worlds].map(id => `/images/card-worlds/${id}.webp`)}
          size={150}
          aspectRatio={0.78}
          radius={3}
          threshold={70}
          lifetime={0.9}
          rotation={14}
          sizeVariance={0.25}
          drift={0.4}
        />
      </div>
      {pins.length > 0 && (
        <ul className="board">
          {pins.map((pin, i) => (
            <li className="pin" key={pin.name}>
              <TornBacking seed={211 + i * 19} depth={3} className="slip-paper" />
              <span className="pin-tape" aria-hidden="true" />
              <h3 className="pin-name">{pin.href ? <a href={pin.href} target="_blank" rel="noreferrer">{pin.name}</a> : pin.name}</h3>
              <p className="pin-note">{pin.note}</p>
            </li>
          ))}
        </ul>
      )}
      <Deal order={2} kind="slap" className="shred-wrap">
        <Shredder
          items={placeholders}
          width={400}
          height={520}
          inset={16}
          gap={10}
          fallHeight={170}
          loopAfterDelete
          color="#2f2a20"
          slitColor="#2f2a20"
          renderItem={item => <div className="shred-note">{item.text}</div>}
        />
      </Deal>
      <Deal order={5} kind="slide" className="ask-row">
        <a className="ask-note" href={`mailto:${contact.email}`}>Ask me what's been on my mind.</a>
      </Deal>
    </>
  );
}

function InkLinks({ ink, paper }: { ink: string; paper: string }) {
  const [apart, setApart] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  // Chrome lets Tab land on the library's decorative SVG group, despite aria-hidden.
  useEffect(() => {
    navRef.current?.querySelectorAll("svg g").forEach(group => group.setAttribute("tabindex", "-1"));
  });
  return (
    <Magnet padding={50} magnetStrength={3} wrapperClassName="ink-magnet">
      <nav
        ref={navRef}
        className="ink-links"
        aria-label="Contact"
        onPointerEnter={() => setApart(true)}
        onPointerLeave={() => setApart(false)}
        onFocus={() => setApart(true)}
        onBlur={() => setApart(false)}
        style={{ "--ink-paper": paper } as CSSProperties}
      >
        <Liquid blur={5} contrast={16} fill={ink}>
          <Liquid.Item x={apart ? -14 : 0} y={apart ? -3 : 0} transition="bouncy">
            <a className="ink-link" href={`mailto:${contact.email}`}>Email</a>
          </Liquid.Item>
          <Liquid.Item x={apart ? 14 : 0} y={apart ? 3 : 0} transition="bouncy" delay={30}>
            <a className="ink-link" href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          </Liquid.Item>
        </Liquid>
      </nav>
    </Magnet>
  );
}

function ChapterBody({ id }: { id: ChapterId }) {
  switch (id) {
    case "music": return <MusicChapter />;
    case "projects": return <ProjectsChapter />;
    case "experience": return <ExperienceChapter />;
    case "inspiration": return <InspirationChapter />;
    case "about-me": return <AboutChapter />;
  }
}

function AboutHeadline({ text, live }: { text: string; live: boolean }) {
  if (!live) return <span style={{ visibility: "hidden" }}>{text}</span>;
  return (
    <VariableProximity
      label={text}
      fromFontVariationSettings="'wght' 450"
      toFontVariationSettings="'wght' 800"
      radius={170}
      falloff="gaussian"
      scale={1.22}
      lift={0.1}
    />
  );
}

// The page is the paper. The arch shrinks to a small plate tipped in beside it.
// The texture captured for the unfold is the empty sheet: everything in the
// column is mounted once the paper is flat, and lands on it.
export function ChapterFace({ card, index, live }: {
  card: { id: ChapterId; title: string; suit: string; accent: string; stock: string };
  index: number;
  live: boolean;
}) {
  const copy = chapterCopy[card.id];
  return (
    <ClickSpark sparkColor={[card.accent, ...paperConfetti]} shape="star" sparkCount={12} sparkSize={13} sparkRadius={56} gravity={0.7} randomness={0.6} duration={620}>
      <div className="card-heading">
        <span className="card-rank" aria-hidden="true">
          {index + 1}<small>{card.suit}</small>
        </span>
        <Dialog.Title asChild>
          <h2 className="card-title">{card.title}</h2>
        </Dialog.Title>
      </div>
      <div className="chapter-layout" data-chapter={card.id} data-live={live || undefined}>
        <aside className="chapter-rail">
          <div className="card-window chapter-arch">
            <PaperImage
              label={`${card.title} artwork`}
              className="card-world-art"
              src={`/images/card-worlds/${card.id}.webp`}
              alt=""
              width="768"
              height="1024"
              decoding="async"
              draggable="false"
            />
          </div>
          <p className="chapter-note">{copy.note}</p>
          <InkLinks ink={card.accent} paper={card.stock} />
        </aside>
        <div className="chapter-sheet">
          <TornBacking seed={index * 7 + 40} depth={16} across={70} down={44} className="sheet-under sheet-under-ledger" />
          <TornBacking seed={index * 7 + 70} depth={14} across={70} down={44} className="sheet-under sheet-under-stock" />
          <TornBacking seed={index * 7 + 3} depth={10} across={90} down={54} className="sheet-paper" />
          <PaperImage className="chapter-cutout cutout-rosette" src="/images/scrapbook/cutout-rosette.webp" alt="" width="520" height="520" decoding="async" />
          <PaperImage className="chapter-cutout cutout-gateway" src="/images/scrapbook/cutout-gateway.webp" alt="" width="520" height="520" decoding="async" />
          <div className="sheet-scroll" tabIndex={0} role="region" aria-label={`${card.title} chapter`}>
            <div className="sheet-column">
              <header className="chapter-lede">
                <p className="chapter-headline">
                  {card.id === "about-me" ? <AboutHeadline text={copy.headline} live={live} /> : <Headline text={copy.headline} live={live} />}
                </p>
                <Dialog.Description asChild>
                  <p className="chapter-intro">{copy.intro}</p>
                </Dialog.Description>
              </header>
              {live && <ChapterBody id={card.id} />}
            </div>
          </div>
        </div>
      </div>
    </ClickSpark>
  );
}
