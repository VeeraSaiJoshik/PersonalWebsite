"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import CircularText from "./circular-text";
import ElasticSlider from "./elastic-slider";

// The Bilawal scale, which matches the white keys. Telugu swaras carry on the
// greeting's alternate script.
const keys = [
  { name: "sa", telugu: "స", freq: 261.63, key: "a", stock: "#c9663f", ink: "#fff4e0" },
  { name: "re", telugu: "రి", freq: 293.66, key: "s", stock: "#e2b04a", ink: "#3a2c14" },
  { name: "ga", telugu: "గ", freq: 329.63, key: "d", stock: "#ecd2c1", ink: "#5f2f21" },
  { name: "ma", telugu: "మ", freq: 349.23, key: "f", stock: "#29435b", ink: "#f6efdf" },
  { name: "pa", telugu: "ప", freq: 392.0, key: "g", stock: "#d3dfe6", ink: "#233a4f" },
  { name: "dha", telugu: "ద", freq: 440.0, key: "h", stock: "#8b4a5e", ink: "#fff4e0" },
  { name: "ni", telugu: "ని", freq: 493.88, key: "j", stock: "#d7dfca", ink: "#35462f" },
  { name: "sa", telugu: "స", freq: 523.25, key: "k", stock: "#c9663f", ink: "#fff4e0" },
];

type Voice = { stop: () => void };
type Flyer = { id: number; x: number; label: string; color: string };

export function PaperHarmonium() {
  const audio = useRef<{ context: AudioContext; master: GainNode } | null>(null);
  const voices = useRef(new Map<number, Voice>());
  const [down, setDown] = useState<number[]>([]);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [volume, setVolume] = useState(55);
  const [spin, setSpin] = useState(0);
  const flyerId = useRef(0);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const start = useCallback((index: number) => {
    if (voices.current.has(index)) return;
    // Browsers only allow audio after a gesture, and every path here is one.
    if (!audio.current) {
      const context = new AudioContext();
      const master = context.createGain();
      master.connect(context.destination);
      audio.current = { context, master };
    }
    const { context, master } = audio.current;
    if (context.state === "suspended") void context.resume();
    master.gain.value = (volumeRef.current / 100) * 0.5;

    // Reedy and slightly detuned, with a soft swell like air through bellows.
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1500;
    gain.connect(master);
    filter.connect(gain);
    const oscillators = [-5, 4].map(detune => {
      const osc = context.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = keys[index].freq;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start();
      return osc;
    });
    const now = context.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
    voices.current.set(index, {
      stop: () => {
        const at = context.currentTime;
        gain.gain.cancelScheduledValues(at);
        gain.gain.setValueAtTime(gain.gain.value, at);
        gain.gain.linearRampToValueAtTime(0, at + 0.22);
        oscillators.forEach(osc => osc.stop(at + 0.24));
      },
    });

    setDown(current => [...current, index]);
    setSpin(value => value + 1);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = flyerId.current++;
      setFlyers(current => [...current, { id, x: (index + 0.5) / keys.length, label: keys[index].telugu, color: keys[index].stock }]);
    }
  }, []);

  const stop = useCallback((index: number) => {
    voices.current.get(index)?.stop();
    voices.current.delete(index);
    setDown(current => current.filter(value => value !== index));
  }, []);

  const stopAll = useCallback(() => {
    Array.from(voices.current.keys()).forEach(stop);
  }, [stop]);

  useEffect(() => {
    const keyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const index = keys.findIndex(key => key.key === event.key.toLowerCase());
      if (index >= 0) start(index);
    };
    const keyUp = (event: KeyboardEvent) => {
      const index = keys.findIndex(key => key.key === event.key.toLowerCase());
      if (index >= 0) stop(index);
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("pointerup", stopAll);
    window.addEventListener("blur", stopAll);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("pointerup", stopAll);
      window.removeEventListener("blur", stopAll);
      stopAll();
      void audio.current?.context.close();
    };
  }, [start, stop, stopAll]);

  return (
    <div className="harmonium">
      <div className="deal deal-slap vinyl" style={{ "--deal-order": 1 } as CSSProperties}>
        <div className="vinyl-disc" data-spin={spin % 2}>
          <CircularText
            text="PLAY ME ✦ FLING ME ✦ "
            size={208}
            fontSize={15}
            fontWeight={600}
            letterSpacing={2}
            color="#f6efdf"
            spinDuration={14}
            onHover="speedUp"
            draggable
          >
            <span className="vinyl-label">side A</span>
          </CircularText>
        </div>
        <div className="vinyl-volume">
          <ElasticSlider
            value={volume}
            onChange={setVolume}
            maxValue={100}
            valuePosition="none"
            trackColor="#2f2a2030"
            rangeColor="#c9663f"
            iconColor="#5c5444"
          />
        </div>
      </div>
      <div
        className="harmonium-keys"
        role="group"
        aria-label="Paper harmonium. Press a key, or use A through K on your keyboard."
        onPointerLeave={stopAll}
      >
        {flyers.map(flyer => (
          <span
            key={flyer.id}
            className="harmonium-flyer"
            aria-hidden="true"
            lang="te"
            style={{ left: `${flyer.x * 100}%`, color: flyer.color, rotate: `${(flyer.id * 47) % 50 - 25}deg` }}
            onAnimationEnd={() => setFlyers(current => current.filter(item => item.id !== flyer.id))}
          >
            {flyer.label}
          </span>
        ))}
        {keys.map((key, index) => (
          <button
            key={`${key.name}-${index}`}
            type="button"
            className="harmonium-key deal deal-drop"
            data-down={down.includes(index) || undefined}
            aria-label={`${key.name}, keyboard ${key.key.toUpperCase()}`}
            style={{ "--deal-order": 2 + index * 0.6, "--key-stock": key.stock, "--key-ink": key.ink, "--key-tilt": `${(index % 3 - 1) * 0.7}deg` } as CSSProperties}
            onPointerDown={event => {
              // Touch pointers capture by default, which would stop a glissando.
              event.currentTarget.releasePointerCapture?.(event.pointerId);
              start(index);
            }}
            onPointerEnter={event => { if (event.buttons) start(index); }}
            onPointerLeave={() => stop(index)}
            onKeyDown={event => { if ((event.key === " " || event.key === "Enter") && !event.repeat) { event.preventDefault(); start(index); } }}
            onKeyUp={event => { if (event.key === " " || event.key === "Enter") stop(index); }}
          >
            <span className="harmonium-telugu" lang="te">{key.telugu}</span>
            <span className="harmonium-name">{key.name}</span>
            <kbd>{key.key}</kbd>
          </button>
        ))}
      </div>
    </div>
  );
}
