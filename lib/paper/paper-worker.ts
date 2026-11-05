import { createPaperPath } from "./paper-geometry";

self.onmessage = (event: MessageEvent<{ id: number; rest: Float32Array; indices: number[]; shortSide: number; density: number; sharpness: number; depth: number; seed: number }>) => {
  const { id, rest, indices, shortSide, density, sharpness, depth, seed } = event.data;
  try {
    const path = createPaperPath(rest, indices, shortSide, density, sharpness, depth, seed);
    self.postMessage({ id, path }, { transfer: [...path.samples.map(sample => sample.buffer), path.creased.buffer] });
  } catch (error) {
    self.postMessage({ id, error: String(error) });
  }
};
