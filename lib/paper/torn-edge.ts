// A hand-torn outline as a CSS polygon. Offsets stay in px while positions are
// percentages, so the tear keeps its grain at any size instead of stretching.
// Plain clip-paths also survive html-to-image, unlike SVG filter references.

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function tornClip(seed: number, depth = 5, across = 44, down = 18) {
  const next = random(seed);
  // Long lazy wander plus fine fibre noise, always inset from the box.
  const edge = (count: number) => {
    const phase = next() * Math.PI * 2;
    const waves = 2 + next() * 3;
    return Array.from({ length: count + 1 }, (_, i) => {
      const wander = 0.5 + 0.5 * Math.sin(phase + (i / count) * waves * Math.PI * 2);
      return +(depth * (wander * 0.55 + next() * 0.45)).toFixed(1);
    });
  };
  const at = (i: number, count: number) => +((i / count) * 100).toFixed(2);
  // Side edges skip their ends: those points sit on the box corner and would
  // poke a spike past the top and bottom tears.
  const inner = (offsets: number[]) => offsets.slice(1, -1);
  const points = [
    ...edge(across).map((o, i) => `${at(i, across)}% ${o}px`),
    ...inner(edge(down)).map((o, i) => `calc(100% - ${o}px) ${at(i + 1, down)}%`),
    ...edge(across).map((o, i) => `${100 - at(i, across)}% calc(100% - ${o}px)`),
    ...inner(edge(down)).map((o, i) => `${o}px ${100 - at(i + 1, down)}%`),
  ];
  return `polygon(${points.join(",")})`;
}
