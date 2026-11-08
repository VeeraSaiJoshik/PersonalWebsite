"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { BorderBeam } from "border-beam";
import { Liquid } from "liquid-gooey";
import CircularText from "./circular-text";
import CountUp from "./count-up";
import TearTicket from "./tear-ticket";
import { tornClip } from "@/lib/paper/torn-edge";
import { about, alongside, before, contact, now, pins, projects, records, type ChapterId, type Role, type Stat } from "@/lib/chapters";

/** True once the paper has flattened and the live page has replaced its texture. */
const LiveContext = createContext(false);

export const ChapterLive = LiveContext.Provider;

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

/** Figures already on screen stay still. Anything below the fold counts as it arrives. */
function Figure({ stat }: { stat: Stat }) {
  const live = useContext(LiveContext);
  const ref = useRef<HTMLSpanElement>(null);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!live || !stat.count || !node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      setCounting(!entry.isIntersecting);
      observer.disconnect();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [live, stat.count]);

  return (
    <div className="figure">
      <dt className="figure-label">{stat.label}</dt>
      <dd className="figure-value" ref={ref}>
        <span className="figure-ghost" aria-hidden={counting || undefined}>{stat.value}</span>
        {counting && stat.count && (
          <span className="figure-count">
            <CountUp
              to={stat.count.to}
              prefix={stat.count.prefix}
              suffix={stat.count.suffix}
              separator={stat.count.separator}
              duration={1.1}
            />
          </span>
        )}
      </dd>
    </div>
  );
}

function Figures({ stats }: { stats?: Stat[] }) {
  if (!stats?.length) return null;
  return <dl className="figures">{stats.map(stat => <Figure key={stat.label} stat={stat} />)}</dl>;
}

function Tools({ tools }: { tools?: string[] }) {
  if (!tools?.length) return null;
  return (
    <ul className="tools" aria-label="Tools">
      {tools.map(tool => <li key={tool}>{tool}</li>)}
    </ul>
  );
}

function RoleSlip({ role, seed, featured = false }: { role: Role; seed: number; featured?: boolean }) {
  const live = useContext(LiveContext);
  const body = (
    <article className={`slip${featured ? " slip-featured" : ""}`}>
      {!featured && <TornBacking seed={seed} depth={4} className="slip-paper" />}
      <p className="slip-when">
        <span>{role.when}</span>
        {role.where && <span className="slip-where">{role.where}</span>}
      </p>
      <div className="slip-body">
        <h4 className="slip-org">{role.org}</h4>
        <p className="slip-title">{role.title}</p>
        <Figures stats={role.stats} />
        <ul className="slip-points">
          {role.points.map(point => <li key={point}>{point}</li>)}
        </ul>
        <Tools tools={role.tools} />
      </div>
    </article>
  );
  if (!featured) return body;
  return (
    <BorderBeam
      size="md"
      colorVariant="sunset"
      theme="light"
      strength={0.55}
      duration={7}
      borderRadius={6}
      active={live}
      className="slip-beam"
    >
      {body}
    </BorderBeam>
  );
}

/** `later` sections sit below the fold, so they are left out of the paper texture. */
function Section({ title, later = false, children }: { title: string; later?: boolean; children: ReactNode }) {
  return (
    <section className="chapter-section" data-capture={later ? "exclude" : undefined}>
      <h3 className="section-title">{title}</h3>
      {children}
    </section>
  );
}

function ExperienceChapter() {
  return (
    <>
      <Section title="Right now">
        <RoleSlip role={now[0]} seed={11} featured />
        <RoleSlip role={now[1]} seed={23} />
      </Section>
      <Section title="Before this" later>
        {before.map((role, i) => <RoleSlip key={role.org} role={role} seed={37 + i * 13} />)}
      </Section>
      <Section title="Started alongside school" later>
        {alongside.map((role, i) => <RoleSlip key={role.org} role={role} seed={71 + i * 17} />)}
      </Section>
    </>
  );
}

// Card stocks from the landing deck, pale enough to carry body text.
const pileStocks = [
  { stock: "#ecd2c1", ink: "#5f2f21" },
  { stock: "#e8dbb9", ink: "#4a3b22" },
  { stock: "#d3dfe6", ink: "#233a4f" },
  { stock: "#e6d3d6", ink: "#533a46" },
  { stock: "#d7dfca", ink: "#35462f" },
  { stock: "#f0e4cb", ink: "#5f2f21" },
];

function ProjectsChapter() {
  return (
    <ol className="pile">
      {projects.map((project, i) => (
        <li
          key={project.name}
          className="pile-card"
          data-capture={i > 1 ? "exclude" : undefined}
          style={{ "--i": i, "--pile-stock": pileStocks[i].stock, "--pile-ink": pileStocks[i].ink } as CSSProperties}
        >
          <TornBacking seed={131 + i * 29} depth={4} className="pile-paper" />
          <div className="pile-tab">
            <span className="pile-number" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="pile-name">{project.name}</h3>
            <span className="pile-home">{project.home}</span>
          </div>
          <div className="pile-body">
            <p className="pile-summary">{project.summary}</p>
            <Figures stats={project.stats} />
            {project.points.length > 0 && (
              <ul className="slip-points">
                {project.points.map(point => <li key={point}>{point}</li>)}
              </ul>
            )}
            <Tools tools={project.tools} />
          </div>
        </li>
      ))}
    </ol>
  );
}

const subscribeToNarrow = (update: () => void) => {
  const media = window.matchMedia("(max-width: 760px)");
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
};
const getNarrow = () => window.matchMedia("(max-width: 760px)").matches;

function ContactTicket() {
  // The ticket scales itself down to fit, so a phone gets its own proportions
  // rather than a miniature of the desktop ticket with unreadable links.
  const narrow = useSyncExternalStore(subscribeToNarrow, getNarrow, () => false);
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

function AboutChapter() {
  return (
    <>
      <div className="about-lede">
        <p className="about-copy">{about.paragraphs[1]}</p>
        <div className="about-seal">
          <CircularText
            text={about.seal}
            size={148}
            fontSize={13}
            fontWeight={500}
            letterSpacing={1}
            spinDuration={46}
            onHover="slowDown"
            ring
          >
            <span className="about-seal-mark">UVA<br />2030</span>
          </CircularText>
        </div>
      </div>
      <Section title="Education">
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
      </Section>
      <Section title="Honors" later>
        <div className="ledger">
          {about.honors.map(honor => (
            <div className="ledger-row" key={honor.title}>
              <div>
                <h4 className="ledger-title">{honor.title}</h4>
                <p>{honor.note}</p>
              </div>
              <p className="ledger-when">{honor.when}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Toolkit" later>
        <div className="toolkit">
          <div>
            <h4 className="toolkit-title">Languages</h4>
            <Tools tools={about.languages} />
          </div>
          <div>
            <h4 className="toolkit-title">Frameworks and platforms</h4>
            <Tools tools={about.frameworks} />
          </div>
        </div>
      </Section>
      <Section title="Say hello" later>
        <ContactTicket />
      </Section>
    </>
  );
}

/** A torn scrap cut from a chapter's artwork, for pages still waiting on content. */
function Clipping({ seed, art, position, zoom, className }: { seed: number; art: string; position: string; zoom: number; className: string }) {
  const clip = useMemo(() => tornClip(seed, 7, 30, 22), [seed]);
  return (
    <span className={`clipping ${className}`} aria-hidden="true">
      <span
        className="clipping-art"
        style={{ clipPath: clip, backgroundImage: `url(/images/card-worlds/${art}.webp)`, backgroundPosition: position, backgroundSize: `${zoom}% auto` }}
      />
      <span className="clipping-tape" />
    </span>
  );
}

function AskNote({ children }: { children: ReactNode }) {
  return (
    <a className="ask-note" href={`mailto:${contact.email}`}>
      <span className="clipping-tape" aria-hidden="true" />
      {children}
    </a>
  );
}

function MusicChapter() {
  if (records.length) {
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
  return (
    <div className="collage collage-music">
      <span className="collage-disc" aria-hidden="true" />
      <span className="collage-disc collage-disc-back" aria-hidden="true" />
      <Clipping seed={301} art="music" position="46% 20%" zoom={190} className="clip-a" />
      <Clipping seed={317} art="music" position="12% 74%" zoom={270} className="clip-b" />
      <AskNote>Ask me what's on repeat.</AskNote>
    </div>
  );
}

function InspirationChapter() {
  if (pins.length) {
    return (
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
    );
  }
  return (
    <div className="collage collage-inspiration">
      <Clipping seed={331} art="inspiration" position="74% 12%" zoom={230} className="clip-a" />
      <Clipping seed={347} art="inspiration" position="20% 38%" zoom={250} className="clip-b" />
      <Clipping seed={359} art="inspiration" position="16% 82%" zoom={300} className="clip-c" />
      <AskNote>Ask me what's been on my mind.</AskNote>
    </div>
  );
}

export function InkLinks({ ink, paper }: { ink: string; paper: string }) {
  const [apart, setApart] = useState(false);
  return (
    <nav
      className="ink-links"
      aria-label="Contact"
      onPointerEnter={() => setApart(true)}
      onPointerLeave={() => setApart(false)}
      onFocus={() => setApart(true)}
      onBlur={() => setApart(false)}
      style={{ "--ink-paper": paper } as CSSProperties}
    >
      <Liquid blur={4} contrast={16} fill={ink}>
        <Liquid.Item x={apart ? -7 : 0} transition="bouncy">
          <a className="ink-link" href={`mailto:${contact.email}`}>Email</a>
        </Liquid.Item>
        <Liquid.Item x={apart ? 7 : 0} transition="bouncy" delay={30}>
          <a className="ink-link" href={contact.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
        </Liquid.Item>
      </Liquid>
    </nav>
  );
}

export function ChapterBody({ id }: { id: ChapterId }) {
  switch (id) {
    case "music": return <MusicChapter />;
    case "projects": return <ProjectsChapter />;
    case "experience": return <ExperienceChapter />;
    case "inspiration": return <InspirationChapter />;
    case "about-me": return <AboutChapter />;
  }
}
