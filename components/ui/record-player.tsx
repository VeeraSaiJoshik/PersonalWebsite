"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowUpRight, Pause, Play, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { Deal, prefersReducedMotion, stockVars, TornBacking } from "./chapter-bits";
import ElasticSlider from "./elastic-slider";
import { linerNotes } from "@/lib/chapters";
import { bonusTrack, spotifyUrl, topTracks, type Track } from "@/lib/records";

const allTracks = [...topTracks, bonusTrack];
const bonusIndex = allTracks.length - 1;
const degreesPerSecond = 200; // 33 rpm
const scratchSecondsPerTurn = 1.8;

const sleeveStocks = [
  { stock: "#c9663f", ink: "#fff4e0" },
  { stock: "#29435b", ink: "#f6efdf" },
  { stock: "#e2b04a", ink: "#3a2c14" },
  { stock: "#8b4a5e", ink: "#fff4e0" },
];

const sleeveVars = (index: number) => {
  const tone = sleeveStocks[index % sleeveStocks.length];
  return { "--sleeve-stock": tone.stock, "--sleeve-ink": tone.ink, "--sleeve-tilt": `${(index * 37) % 5 - 2}deg` } as CSSProperties;
};

/** Who turns up most often, counted from the list so it can't drift out of date. */
function topArtists(count: number) {
  const tally = new Map<string, number>();
  for (const track of topTracks) {
    for (const name of track.by.split(", ")) tally.set(name, (tally.get(name) ?? 0) + 1);
  }
  return [...tally].sort((a, b) => b[1] - a[1]).slice(0, count);
}

function Sleeve({ track, index, current, playing, onPick }: {
  track: Track;
  index: number;
  current: boolean;
  playing: boolean;
  onPick: () => void;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <button
      type="button"
      className="sleeve"
      style={sleeveVars(index)}
      aria-current={current || undefined}
      aria-label={`${track.title} by ${track.by}. ${track.preview ? (current && playing ? "Pause" : "Play a preview") : "Show on the turntable"}.`}
      onClick={onPick}
    >
      <span className="sleeve-art">
        <span className="sleeve-disc" aria-hidden="true" />
        <span className="sleeve-cover" aria-hidden="true">
          {track.art && !broken
            ? <img src={track.art} alt="" width="600" height="600" loading="lazy" decoding="async" draggable="false" onError={() => setBroken(true)} />
            : <span>{track.title.split(/[(|[]/)[0]}</span>}
        </span>
        <span className="sleeve-rank" aria-hidden="true">{track.rank}</span>
        {current && playing && <span className="sleeve-playing" aria-hidden="true">on now</span>}
      </span>
      <span className="sleeve-title" aria-hidden="true">{track.explicit && <span className="sleeve-explicit">E</span>}{track.title.split(/ \(|\s\|/)[0]}</span>
      <span className="sleeve-by" aria-hidden="true">{track.by.split(", ").slice(0, 2).join(", ")}</span>
    </button>
  );
}

// The record on the deck is a real platter: it spins up when a preview starts,
// coasts down when it stops, and follows the hand when grabbed. The audio follows
// the same turn, which is what makes dragging it feel like a scratch.
export function RecordPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const platterRef = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);
  const [failed, setFailed] = useState<number[]>([]);
  const track = allTracks[index];
  const hasPreview = !!track.preview && !failed.includes(index);
  const tally = useMemo(() => topArtists(3), []);
  // iOS ignores element volume, and routing these previews through Web Audio instead
  // would play silence without CORS headers. So where it can't work, there's no slider.
  const [volumeWorks] = useState(() => { const probe = new Audio(); probe.volume = 0.5; return probe.volume !== 1; });

  const motion = useRef({ angle: 0, speed: 0, target: 0, dragging: false, moved: false, lastAngle: 0, startX: 0, startY: 0 });

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    motion.current.target = playing && !prefersReducedMotion() ? degreesPerSecond : 0;
  }, [playing]);

  useEffect(() => {
    let frame = 0, previous = 0;
    const turn = (now: number) => {
      const state = motion.current;
      const dt = previous ? Math.min(0.05, (now - previous) / 1000) : 0;
      previous = now;
      if (!state.dragging) {
        state.speed += (state.target - state.speed) * (1 - Math.exp(-dt * 3.5));
        if (Math.abs(state.speed) > 0.5) state.angle += state.speed * dt;
      }
      if (platterRef.current) platterRef.current.style.rotate = `${state.angle.toFixed(2)}deg`;
      frame = requestAnimationFrame(turn);
    };
    frame = requestAnimationFrame(turn);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  // Runs inside the click, because browsers only start audio from a gesture.
  const load = useCallback((next: number) => {
    const audio = audioRef.current;
    setIndex(next);
    setProgress(0);
    if (!audio) return;
    const source = allTracks[next].preview;
    if (!source) { audio.pause(); audio.removeAttribute("src"); audio.load(); setLoaded(false); return; }
    audio.src = source;
    setLoaded(true);
    audio.play().catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !hasPreview) return;
    if (!loaded) { load(index); return; }
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }, [hasPreview, index, load, loaded]);

  const pick = (next: number) => {
    if (next === index && loaded) toggle();
    else load(next);
  };

  const step = (direction: 1 | -1) => {
    const start = index === bonusIndex ? 0 : index;
    load((start + direction + topTracks.length) % topTracks.length);
  };

  const surprise = () => {
    const options = topTracks.map((_, i) => i).filter(i => i !== index && topTracks[i].preview && !failed.includes(i));
    if (options.length) load(options[Math.floor(Math.random() * options.length)]);
  };

  const onEnded = () => {
    for (let hop = 1; hop <= topTracks.length; hop++) {
      const next = ((index === bonusIndex ? -1 : index) + hop) % topTracks.length;
      if (topTracks[next].preview && !failed.includes(next)) { load(next); return; }
    }
  };

  const pointerAngle = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return Math.atan2(event.clientY - (box.top + box.height / 2), event.clientX - (box.left + box.width / 2)) * 180 / Math.PI;
  };

  const onDiscDown = (event: PointerEvent<HTMLButtonElement>) => {
    const state = motion.current;
    state.dragging = true;
    state.moved = false;
    state.lastAngle = pointerAngle(event);
    state.startX = event.clientX;
    state.startY = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onDiscMove = (event: PointerEvent<HTMLButtonElement>) => {
    const state = motion.current;
    if (!state.dragging) return;
    if (Math.hypot(event.clientX - state.startX, event.clientY - state.startY) > 5) state.moved = true;
    if (!state.moved) return;
    const angle = pointerAngle(event);
    const delta = ((angle - state.lastAngle + 540) % 360) - 180;
    state.lastAngle = angle;
    state.angle += delta;
    const audio = audioRef.current;
    if (audio && loaded && Number.isFinite(audio.duration)) {
      audio.currentTime = Math.max(0, Math.min(audio.duration - 0.05, audio.currentTime + (delta / 360) * scratchSecondsPerTurn));
    }
  };

  const onDiscEnd = () => { motion.current.dragging = false; };

  // A drag on the record shouldn't also count as a tap on it.
  const onDiscClick = () => {
    if (motion.current.moved) { motion.current.moved = false; return; }
    toggle();
  };

  const arm = playing ? 15 + progress * 15 : 0;

  return (
    <div className="music-floor">
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        onError={() => { if (audioRef.current?.getAttribute("src")) { setFailed(list => [...list, index]); setPlaying(false); } }}
        onTimeUpdate={event => {
          const { currentTime, duration } = event.currentTarget;
          if (duration) setProgress(currentTime / duration);
        }}
      />
      <div className="deck-column">
        <Deal order={1} kind="slap">
          <div className="deck">
            <TornBacking seed={77} depth={7} across={36} down={36} className="deck-paper" />
            <div className="deck-plate">
              <button
                type="button"
                className="deck-disc"
                style={sleeveVars(index)}
                aria-label={hasPreview ? (playing ? "Pause. Drag the record to scratch it." : "Play. Drag the record to scratch it.") : "No preview for this record"}
                onPointerDown={onDiscDown}
                onPointerMove={onDiscMove}
                onPointerUp={onDiscEnd}
                onPointerCancel={onDiscEnd}
                onClick={onDiscClick}
              >
                <span className="deck-platter" ref={platterRef} aria-hidden="true">
                  <span className="deck-label deck-label-land" key={track.title}>
                    {track.art && <img src={track.art} alt="" width="600" height="600" decoding="async" draggable="false" />}
                  </span>
                </span>
              </button>
              <span className="deck-arm" style={{ "--arm": `${arm}deg` } as CSSProperties} aria-hidden="true">
                <svg viewBox="0 0 60 300" preserveAspectRatio="none">
                  <circle cx="30" cy="22" r="20" fill="#f6efdf" />
                  <circle cx="30" cy="22" r="7" fill="#29435b" />
                  <path d="M30 22 L30 214 L14 262" fill="none" stroke="#f6efdf" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="2" y="252" width="24" height="38" rx="4" fill="#e2b04a" transform="rotate(18 14 271)" />
                </svg>
              </span>
            </div>
            <div className="deck-now" aria-live="polite">
              <p className="deck-rank">{track.rank ? `Number ${track.rank}` : "Bonus track"}{track.explicit ? ", clean version" : ""}</p>
              <p className="deck-title">{track.title}</p>
              <p className="deck-by">{track.by}</p>
              {!hasPreview && <p className="deck-missing">No preview for this one. Find it on Spotify.</p>}
            </div>
            <div className="deck-progress" aria-hidden="true"><span style={{ "--progress": progress } as CSSProperties} /></div>
            <div className="deck-controls">
              <button type="button" className="deck-button" aria-label="Previous track" onClick={() => step(-1)}><SkipBack aria-hidden="true" size={18} /></button>
              <button type="button" className="deck-button deck-play" aria-label={playing ? "Pause" : "Play"} disabled={!hasPreview} onClick={toggle}>
                {playing ? <Pause aria-hidden="true" size={24} /> : <Play aria-hidden="true" size={24} />}
              </button>
              <button type="button" className="deck-button" aria-label="Next track" onClick={() => step(1)}><SkipForward aria-hidden="true" size={18} /></button>
              <button type="button" className="deck-surprise" onClick={surprise}><Shuffle aria-hidden="true" size={16} />Surprise me</button>
              {volumeWorks && (
                <div className="deck-volume">
                  <ElasticSlider value={volume} onChange={setVolume} maxValue={100} valuePosition="none" trackColor="#f6efdf40" rangeColor="#e2b04a" iconColor="#f6efdf" />
                </div>
              )}
            </div>
            <div className="deck-links">
              <a href={spotifyUrl(track)} target="_blank" rel="noreferrer">Find it on Spotify<ArrowUpRight aria-hidden="true" size={15} /></a>
              {track.apple && <a href={track.apple} target="_blank" rel="noreferrer">Preview from Apple Music<ArrowUpRight aria-hidden="true" size={15} /></a>}
            </div>
          </div>
        </Deal>
      </div>
      <Deal order={2} kind="slide" className="crate-column">
        <ul className="tally" aria-label="Who turns up most">
          {tally.map(([name, count]) => <li key={name}>{name}, {count} times</li>)}
          <li>4 songs from one film: Hi Nanna</li>
        </ul>
        <ol className="crate">
          {topTracks.map((item, i) => (
            <li key={item.title}>
              <Sleeve track={item} index={i} current={index === i} playing={playing} onPick={() => pick(i)} />
            </li>
          ))}
        </ol>
        <div className="liners">
          <section className="liner" style={stockVars(1)}>
            <TornBacking seed={511} depth={4} across={30} down={16} className="liner-paper" />
            <h3 className="liner-heading">{linerNotes.film.heading}</h3>
            <p>{linerNotes.film.body}</p>
          </section>
          <section className="liner" style={stockVars(2)}>
            <TornBacking seed={533} depth={4} across={30} down={16} className="liner-paper" />
            <h3 className="liner-heading">{linerNotes.leaving.heading}</h3>
            <p>{linerNotes.leaving.body}</p>
            <button type="button" className="liner-play" onClick={() => pick(bonusIndex)}>
              {index === bonusIndex && playing ? <Pause aria-hidden="true" size={16} /> : <Play aria-hidden="true" size={16} />}
              {bonusTrack.title}, {bonusTrack.by}
            </button>
          </section>
        </div>
        <p className="crate-credit">Previews are 30 seconds, and clean versions where a song has one. Artwork and previews from Apple Music.</p>
      </Deal>
    </div>
  );
}
