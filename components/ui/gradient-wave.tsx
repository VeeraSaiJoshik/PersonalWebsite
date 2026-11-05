"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface GradientWaveProps {
  colors?: readonly string[];
  isPlaying?: boolean;
  className?: string;
  shadowPower?: number;
  darkenTop?: boolean;
  noiseSpeed?: number;
  noiseFrequency?: readonly [number, number];
  /** Static film grain; independent from the animated simplex deformation. */
  grain?: number;
  deform?: {
    incline?: number;
    offsetTop?: number;
    offsetBottom?: number;
    noiseFreq?: readonly [number, number];
    noiseAmp?: number;
    noiseSpeed?: number;
    noiseFlow?: number;
    noiseSeed?: number;
  };
}

const DEFAULT_COLORS = [
  "#38bdf8",
  "#ffffff",
  "#38bdf8",
  "#ffffff",
  "#38bdf8",
  "#ffffff",
];
const DEFAULT_FREQUENCY = [0.0001, 0.0009] as const;
const DEFAULT_DEFORM = { incline: 0.5, noiseAmp: 250, noiseFlow: 5 };
const MAX_COLORS = 8;

function normalizedColors(colors: readonly string[]): string[] {
  const valid = colors
    .flatMap((hex) => {
      if (/^#[\da-f]{6}$/i.test(hex)) return [hex.toLowerCase()];
      if (/^#[\da-f]{3}$/i.test(hex))
        return [
          `#${hex
            .slice(1)
            .split("")
            .map((c) => c + c)
            .join("")}`,
        ];
      return [];
    })
    .slice(0, MAX_COLORS);
  if (!valid.length) return DEFAULT_COLORS;
  return valid.length === 1 ? [valid[0], valid[0]] : valid;
}

function normalizeColor(hex: string): number[] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

interface Settings {
  shadowPower: number;
  darkenTop: boolean;
  noiseSpeed: number;
  noiseFrequency: readonly [number, number];
  grain: number;
  deform: Required<NonNullable<GradientWaveProps["deform"]>>;
}

// Simplex noise and plane deformation from the supplied MiniGl/Gradient component.
// Typed GPU ownership replaces the dynamic nested classes so all resources can be
// released, including partially constructed shaders and React StrictMode remounts.
const SIMPLEX = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

function vertexShader(colorCount: number): string {
  return `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
attribute vec2 uvNorm;
uniform mat4 projectionMatrix;
uniform vec2 resolution;
uniform float u_time;
uniform vec2 u_noise_frequency;
uniform float u_noise_speed;
uniform float u_incline;
uniform vec2 u_offsets;
uniform vec2 u_deform_frequency;
uniform float u_deform_amplitude;
uniform float u_deform_speed;
uniform float u_deform_flow;
uniform float u_deform_seed;
uniform vec3 u_colors[${colorCount}];
varying vec3 v_color;
${SIMPLEX}
void main() {
  float time = u_time * u_noise_speed;
  vec2 noiseCoord = resolution * uvNorm * u_noise_frequency;
  float tilt = resolution.y / 2.0 * uvNorm.y;
  float incline = resolution.x * uvNorm.x / 2.0 * u_incline;
  float offset = resolution.x / 2.0 * u_incline * mix(u_offsets.y, u_offsets.x, uv.y);
  float noise = snoise(vec3(
    noiseCoord.x * u_deform_frequency.x + time * u_deform_flow,
    noiseCoord.y * u_deform_frequency.y,
    time * u_deform_speed + u_deform_seed
  )) * u_deform_amplitude;
  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);
  noise = max(0.0, noise);
  vec3 pos = vec3(position.x, position.y + tilt + incline + noise - offset, position.z);
  v_color = u_colors[0];
  // Compile-time bound supports the supplied six-color default without indexing
  // past the original four-entry u_active_colors vector.
  for (int i = 1; i < ${colorCount}; i++) {
    float layer = float(i);
    vec2 frequency = vec2(2.0, 3.0) + layer / float(${colorCount});
    float layerNoise = smoothstep(0.1, 0.63 + 0.07 * layer,
      snoise(vec3(
        noiseCoord.x * frequency.x + time * (6.5 + 0.3 * layer),
        noiseCoord.y * frequency.y,
        time * (11.0 + 0.3 * layer) + 5.0 + 10.0 * layer
      )) / 2.0 + 0.5);
    v_color = mix(v_color, u_colors[i], pow(layerNoise, 4.0));
  }
  gl_Position = projectionMatrix * vec4(pos, 1.0);
}`;
}

const FRAGMENT_SHADER = `
precision mediump float;
varying vec3 v_color;
uniform vec2 u_buffer_size;
uniform float u_pixel_ratio;
uniform float u_darken_top;
uniform float u_shadow_power;
uniform float u_grain;
float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main() {
  vec3 color = v_color;
  if (u_darken_top > 0.5) {
    vec2 st = gl_FragCoord.xy / u_buffer_size;
    color.g -= pow(max(0.0, st.y + sin(-12.0) * st.x), u_shadow_power) * 0.4;
  }
  // Grain is fixed in CSS-pixel space: no flashing or crawling noise.
  color += (grainHash(floor(gl_FragCoord.xy / u_pixel_ratio)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

class MiniGl {
  readonly gl: WebGLRenderingContext;
  private program: WebGLProgram | null = null;
  private shaders: WebGLShader[] = [];
  private buffers: WebGLBuffer[] = [];
  private locations = new Map<string, WebGLUniformLocation | null>();
  private attributes: {
    buffer: WebGLBuffer;
    location: number;
    size: number;
  }[] = [];
  private indexBuffer: WebGLBuffer | null = null;
  private indexCount = 0;
  width = 1;
  height = 1;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly colors: string[],
  ) {
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: true,
      powerPreference: "low-power",
    });
    if (!gl) throw new Error("WebGL not supported");
    this.gl = gl;
    try {
      const program = gl.createProgram();
      if (!program) throw new Error("Unable to allocate WebGL program");
      this.program = program;
      for (const [type, source] of [
        [gl.VERTEX_SHADER, vertexShader(colors.length)],
        [gl.FRAGMENT_SHADER, FRAGMENT_SHADER],
      ] as const) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error("Unable to allocate shader");
        this.shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw new Error(
            gl.getShaderInfoLog(shader) || "Shader compilation failed",
          );
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(
          gl.getProgramInfoLog(program) || "Program linking failed",
        );
      gl.useProgram(program);
      for (const [name, size] of [
        ["position", 3],
        ["uv", 2],
        ["uvNorm", 2],
      ] as const) {
        this.attributes.push({
          buffer: this.newBuffer(),
          location: gl.getAttribLocation(program, name),
          size,
        });
      }
      this.indexBuffer = this.newBuffer();
      gl.uniform3fv(
        this.location("u_colors[0]"),
        new Float32Array(colors.flatMap(normalizeColor)),
      );
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  private newBuffer(): WebGLBuffer {
    const buffer = this.gl.createBuffer();
    if (!buffer) throw new Error("Unable to allocate geometry buffer");
    this.buffers.push(buffer);
    return buffer;
  }

  private location(name: string): WebGLUniformLocation | null {
    if (!this.locations.has(name))
      this.locations.set(name, this.gl.getUniformLocation(this.program!, name));
    return this.locations.get(name)!;
  }

  float(name: string, value: number) {
    this.gl.uniform1f(this.location(name), value);
  }
  vec2(name: string, value: readonly [number, number]) {
    this.gl.uniform2f(this.location(name), value[0], value[1]);
  }

  setSettings(settings: Settings): void {
    this.gl.useProgram(this.program);
    this.float("u_shadow_power", settings.shadowPower);
    this.float("u_darken_top", settings.darkenTop ? 1 : 0);
    this.float("u_noise_speed", settings.noiseSpeed);
    this.vec2("u_noise_frequency", settings.noiseFrequency);
    this.float("u_grain", settings.grain);
    this.float("u_incline", settings.deform.incline);
    this.vec2("u_offsets", [
      settings.deform.offsetTop,
      settings.deform.offsetBottom,
    ]);
    this.vec2("u_deform_frequency", settings.deform.noiseFreq);
    this.float("u_deform_amplitude", settings.deform.noiseAmp);
    this.float("u_deform_speed", settings.deform.noiseSpeed);
    this.float("u_deform_flow", settings.deform.noiseFlow);
    this.float("u_deform_seed", settings.deform.noiseSeed);
  }

  setSize(width: number, height: number): void {
    const gl = this.gl;
    this.width = width;
    this.height = height;
    // Bound both resolution and topology on high-DPI, ultrawide, and mobile screens.
    const dpr = Math.max(
      0.5,
      Math.min(window.devicePixelRatio || 1, 1.5, 3000 / width, 2000 / height),
    );
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);
    this.vec2("resolution", [width, height]);
    this.vec2("u_buffer_size", [this.canvas.width, this.canvas.height]);
    this.float("u_pixel_ratio", dpr);
    gl.uniformMatrix4fv(
      this.location("projectionMatrix"),
      false,
      new Float32Array([
        2 / width,
        0,
        0,
        0,
        0,
        2 / height,
        0,
        0,
        0,
        0,
        -0.001,
        0,
        0,
        0,
        0,
        1,
      ]),
    );
    const xSegs = Math.max(8, Math.min(96, Math.ceil(width * 0.02)));
    const ySegs = Math.max(8, Math.min(64, Math.ceil(height * 0.05)));
    const count = (xSegs + 1) * (ySegs + 1);
    const positions = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);
    const uvNorm = new Float32Array(count * 2);
    const indices = new Uint16Array(xSegs * ySegs * 6);
    for (let y = 0; y <= ySegs; y++) {
      for (let x = 0; x <= xSegs; x++) {
        const i = y * (xSegs + 1) + x;
        positions.set(
          [width * (x / xSegs - 0.5), height * (0.5 - y / ySegs), 0],
          i * 3,
        );
        uv.set([x / xSegs, 1 - y / ySegs], i * 2);
        uvNorm.set([(x / xSegs) * 2 - 1, 1 - (y / ySegs) * 2], i * 2);
        if (x < xSegs && y < ySegs) {
          indices.set(
            [i, i + xSegs + 1, i + 1, i + 1, i + xSegs + 1, i + xSegs + 2],
            (y * xSegs + x) * 6,
          );
        }
      }
    }
    [positions, uv, uvNorm].forEach((values, i) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.attributes[i].buffer);
      gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);
    });
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    this.indexCount = indices.length;
  }

  render(time: number): void {
    const gl = this.gl;
    gl.useProgram(this.program);
    this.float("u_time", time);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    for (const { buffer, location, size } of this.attributes) {
      if (location < 0) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
  }

  dispose(): void {
    for (const buffer of this.buffers) this.gl.deleteBuffer(buffer);
    for (const shader of this.shaders) this.gl.deleteShader(shader);
    if (this.program) this.gl.deleteProgram(this.program);
    this.buffers = [];
    this.shaders = [];
    this.program = null;
  }
}

class Gradient {
  private minigl: MiniGl;
  private settings: Settings;
  private time = 120000; // A composed first frame, including when animation is paused.
  private last = 0;
  private animationId = 0;
  private disposed = false;
  private contextLost = false;
  private inView = true;
  private requested = true;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private media = window.matchMedia("(prefers-reduced-motion: reduce)");

  constructor(
    private canvas: HTMLCanvasElement,
    private container: HTMLDivElement,
    private colors: string[],
    settings: Settings,
  ) {
    this.settings = settings;
    this.minigl = new MiniGl(canvas, colors);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.inView = entry.isIntersecting;
      this.syncPlayback();
    });
    this.resizeObserver.observe(container);
    this.intersectionObserver.observe(container);
    window.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.syncPlayback);
    this.media.addEventListener("change", this.syncPlayback);
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    this.resize();
    this.update(settings);
    container.dataset.renderer = "webgl";
  }

  update(settings: Settings): void {
    this.settings = settings;
    if (this.contextLost || this.disposed) return;
    this.minigl.setSettings(settings);
    this.minigl.render(this.time);
  }

  setPlaying(playing: boolean): void {
    this.requested = playing;
    this.syncPlayback();
  }

  private resize = (): void => {
    if (this.disposed || this.contextLost) return;
    const { width, height } = this.container.getBoundingClientRect();
    if (width <= 0 || height <= 0) {
      this.stop();
      return;
    }
    this.minigl.setSize(width, height);
    this.minigl.setSettings(this.settings);
    this.minigl.render(this.time);
    this.syncPlayback();
  };

  private animate = (timestamp: number): void => {
    if (this.disposed || this.contextLost) return;
    // An ambient background needs at most 30 painted frames per second.
    if (!this.last || timestamp - this.last >= 1000 / 30) {
      this.time += this.last ? Math.min(timestamp - this.last, 1000 / 15) : 0;
      this.last = timestamp;
      this.minigl.render(this.time);
    }
    this.animationId = requestAnimationFrame(this.animate);
  };

  private syncPlayback = (): void => {
    if (this.disposed) return;
    const play =
      this.requested &&
      this.inView &&
      !document.hidden &&
      !this.media.matches &&
      !this.contextLost;
    this.container.dataset.motion = play ? "playing" : "still";
    if (play && !this.animationId) {
      this.last = 0;
      this.animationId = requestAnimationFrame(this.animate);
    } else if (!play) this.stop();
  };

  private stop(): void {
    cancelAnimationFrame(this.animationId);
    this.animationId = 0;
    this.last = 0;
  }

  private onContextLost = (event: Event): void => {
    event.preventDefault();
    this.contextLost = true;
    this.canvas.style.visibility = "hidden";
    this.container.dataset.renderer = "fallback";
    this.syncPlayback();
  };

  private onContextRestored = (): void => {
    if (this.disposed) return;
    this.minigl.dispose();
    try {
      this.minigl = new MiniGl(this.canvas, this.colors);
      this.contextLost = false;
      this.resize();
      this.canvas.style.visibility = "visible";
      this.container.dataset.renderer = "webgl";
    } catch {
      this.contextLost = true;
      this.container.dataset.renderer = "fallback";
    }
  };

  dispose(): void {
    this.disposed = true;
    this.stop();
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    window.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.syncPlayback);
    this.media.removeEventListener("change", this.syncPlayback);
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener(
      "webglcontextrestored",
      this.onContextRestored,
    );
    this.minigl.dispose();
    this.minigl.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

export function GradientWave({
  colors = DEFAULT_COLORS,
  isPlaying = true,
  className,
  shadowPower = 8,
  darkenTop = false,
  noiseSpeed = 0.00001,
  noiseFrequency = DEFAULT_FREQUENCY,
  grain = 0.018,
  deform = DEFAULT_DEFORM,
}: GradientWaveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<Gradient | null>(null);
  const palette = normalizedColors(colors);
  const paletteKey = JSON.stringify(palette);
  const settingsKey = JSON.stringify({
    shadowPower: Math.max(0.1, shadowPower),
    darkenTop,
    noiseSpeed,
    noiseFrequency,
    grain: Math.max(0, Math.min(0.15, grain)),
    deform: {
      incline: deform.incline ?? 0,
      offsetTop: deform.offsetTop ?? -0.5,
      offsetBottom: deform.offsetBottom ?? -0.5,
      noiseFreq: deform.noiseFreq ?? [3, 4],
      noiseAmp: deform.noiseAmp ?? 320,
      noiseSpeed: deform.noiseSpeed ?? 10,
      noiseFlow: deform.noiseFlow ?? 3,
      noiseSeed: deform.noiseSeed ?? 5,
    },
  } satisfies Settings);
  const settingsRef = useRef(settingsKey);
  // Apply updates before construction and before a recreated palette is rendered.
  useEffect(() => {
    settingsRef.current = settingsKey;
  }, [settingsKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block";
    container.appendChild(canvas);
    let gradient: Gradient | null = null;
    try {
      gradient = new Gradient(
        canvas,
        container,
        JSON.parse(paletteKey),
        JSON.parse(settingsRef.current),
      );
      gradientRef.current = gradient;
    } catch {
      // The CSS gradient is an intentional static fallback, not a blank canvas.
      container.dataset.renderer = "fallback";
      container.dataset.motion = "still";
      canvas.remove();
    }
    return () => {
      gradient?.dispose();
      if (gradientRef.current === gradient) gradientRef.current = null;
      canvas.remove();
    };
  }, [paletteKey]);

  useEffect(() => {
    gradientRef.current?.update(JSON.parse(settingsKey));
  }, [settingsKey, paletteKey]);

  useEffect(() => {
    gradientRef.current?.setPlaying(isPlaying);
  }, [isPlaying, paletteKey]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-gradient-wave=""
      className={cn(
        "pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(155deg, ${palette.join(", ")})`,
      }}
    />
  );
}
