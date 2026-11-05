import type { createPaperPath } from "./paper-geometry";

type PaperPath = ReturnType<typeof createPaperPath>;
let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (path: PaperPath) => void; reject: (error: Error) => void }>();
const cache = new Map<string, Promise<PaperPath>>();

export function getPaperPath(rest: Float32Array, indices: number[], shortSide: number, density: number, sharpness: number, depth: number, seed: number) {
  const key = JSON.stringify([rest.length, rest[1], shortSide, density, sharpness, depth, seed]);
  const existing = cache.get(key);
  if (existing) return existing;
  if (!worker) {
    worker = new Worker(new URL("./paper-worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<{ id: number; path: PaperPath; error?: string }>) => {
      const task = pending.get(event.data.id);
      pending.delete(event.data.id);
      if (event.data.error) task?.reject(new Error(event.data.error));
      else task?.resolve(event.data.path);
    };
    worker.onerror = () => {
      pending.forEach(task => task.reject(new Error("Paper geometry could not be prepared.")));
      pending.clear(); cache.clear(); worker?.terminate(); worker = null;
    };
  }
  const id = ++nextId;
  const promise = new Promise<PaperPath>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker!.postMessage({ id, rest, indices, shortSide, density, sharpness, depth, seed });
  }).catch(error => { cache.delete(key); throw error; });
  cache.set(key, promise);
  // Keep the few artwork/page aspect ratios, without retaining unlimited geometry.
  if (cache.size > 24) cache.delete(cache.keys().next().value!);
  return promise;
}
