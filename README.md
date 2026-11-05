# Jo — a Courtyard personal website

A personal landing page centered on “Namaste / I'm Jo,” with generated paper collage, a stationary grainy paper background, and a flowing cursor reveal of **నమస్కారం** (Namaskaram) in Telugu. The separate paper elements, including a layered toran ornament along the top, crawl into place in short, staggered steps. The current design direction is in `design.md`.

Samarkan sets “Namaste,” “Jo,” and the card titles; Tiro Telugu sets the greeting’s alternate. Eczar supplies “I’m,” Kalam remains on paper notes, and Anek Latin handles supporting copy. “Namaste” is smaller and “I’m Jo” is more prominent; Jo stays a simple clay-colored text mark in the greeting.

Brush over Namaste to uncover Telugu. Click, tap, Enter, or Space pins the complete reveal; Escape restores English. Evening mode and a background-motion control sit at the edges. Reduced motion removes the entrance and trail animations.

A React Bits ink blob follows the mouse throughout the landing page and chapter panels, with a short liquid tail, hover growth, and a small click splash. Its white `difference` blend stays visible in both themes. The shared preset lives in `components/ui/app-blob-cursor.tsx`; the original JavaScript/CSS component and TypeScript prop declarations live alongside it. The cursor is loaded only for devices with a fine, hovering pointer and no reduced-motion preference. Touch interaction, keyboard navigation, and WebGL failures retain the native cursor. A body portal keeps the effect above dialogs without intercepting clicks, and unmount restores cursor styles and releases GPU resources.

Five tinted playing cards peek up from the bottom of a fixed, non-scrolling page: Music, Projects, Experience, Inspiration, and About Me. Experience anchors a symmetric fan, optically balanced between the collages on wide screens. Each retains its Samarkan title, tinted stock, ranks, suits and illustrated arch. [React Bits Holo Card](https://reactbits.dev/components/holo-card) adds restrained gold foil and pointer-driven tilt.

Clicking a card crumples its entire face into a paper bundle and drops it below the viewport. A tightly folded page then rises from the same slot, travels to the center, and **uncrumples into the chapter** using the simulation and paper shading from [React Bits Paper Crumple](https://reactbits.dev/micro/paper-crumple). A snapshot of the real page carries its title, artwork and content through the folds, then hands off to the live accessible DOM. Closing crumples the page into a bundle that tumbles down toward its card’s slot. Once the paper falls below the viewport, the original card scoots back up. Radix keeps focus inside the chapter; Escape also works during the entrance. Reduced motion or unavailable WebGL shows the chapter directly.

Hold or drag an entire playing card, any of the three collage pieces, or the artwork inside an open chapter to crumple and move it. Release to flatten and return it to its original position. A short click still opens a card; drag gestures suppress that click and the browser’s native image/text drag preview. Standalone artwork supports holding Space/Enter and moving with arrow keys; cards use Alt+Space and arrow keys. Escape, pointer cancellation, blur and resize restore the piece. One on-demand renderer is shared between picked-up objects, and geometry is prepared in a worker.

A larger, **modern Jo ID badge** hangs at the top left, with clean DM Sans typography, neutral card stock, a black strap and silver hardware. It intentionally has a different visual style from the scrapbook. The supplied [React Bits Lanyard](https://reactbits.dev/components/lanyard) uses a viewport-wide physics stage and a hit target that follows the badge, so it can be dragged anywhere without blocking the rest of the site. Click or press Enter/Space to flip it; Escape resets it. It scales down on short screens. The two small controls now sit together at the top right.

React Bits source attribution is retained in the adapted files, and its license is in `public/licenses/react-bits.md`. Three.js loads in a separate chunk shared by the badge and paper interactions. If WebGL is unavailable, the original artwork, card navigation and a simple ID fallback remain visible.

## Run locally

From `PersonalWebsite`:

```sh
npm install
npm run dev
```

Open the URL printed by Vite. `npm run build` checks TypeScript and creates `dist/`; `npm run preview` serves that production build. Open `design-crate/index.html` directly for the detailed, standalone design guide.

When running a second development preview, give it a separate dependency cache so it cannot invalidate the imports served by the main preview:

```sh
VITE_CACHE_DIR=node_modules/.vite-inspection npm run dev -- --port 5174
```

## Structure

| Path                               | Purpose                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `components/ui/gradient-wave.tsx`  | Reusable wave with the supplied public props and stabilized WebGL rendering |
| `components/ui/button.tsx`         | shadcn-style button, Radix Slot, and variant support                        |
| `components/demo.tsx`              | Minimal full-page gradient example                                          |
| `src/App.tsx`                      | Personal landing page, theme, and motion controls                           |
| `components/ui/app-blob-cursor.tsx` | App-wide cursor preset, device/motion preferences, and body portal          |
| `components/ui/blob-cursor.jsx`    | React Bits liquid cursor with companion CSS and typed props                |
| `components/ui/namaste-reveal.tsx` | English/Telugu greeting with pointer, touch, and keyboard support           |
| `components/ui/collection-card-stack.tsx` | Five playing cards and accessible chapters with a paper-uncrumpling entrance |
| `components/ui/paper-play.tsx` | Shared grab, crumple, return and native-drag suppression for artwork and whole cards |
| `components/ui/holo-card.tsx` | Adapted React Bits holographic foil and tilt around the existing card faces |
| `components/ui/identity-lanyard.tsx` | Modern ID design and the adapted React Bits Lanyard |
| `lib/paper/` | Paper geometry worker, reusable 3D surface, and image/page capture |
| `design.md`                        | Current landing-page composition and interaction direction                  |
| `src/index.css`                    | Global styles, Tailwind v4 import, and shadcn semantic color mappings       |
| `design-crate/tokens.css`          | Brand colors, fonts, spacing, radii, and dark-theme tokens                  |
| `lib/brand.ts`                     | Shared wave color, motion, deformation, and grain preset                    |
| `lib/utils.ts`                     | `cn()` helper for class merging                                             |
| `design-crate/patterns/`           | Six editable SVGs                                                           |
| `design-crate/patterns.css`        | Standalone pattern placement utilities                                      |
| `design-crate/design-brief.txt`    | Design theory, palette, type, placement, and motion rules                   |

`@/` resolves to the project root in both TypeScript and Vite. Reusable UI components belong in **`components/ui`** at the project root, matching `@/components/ui/...` and `components.json`. Keeping this folder separate from page code lets shadcn additions and copied components use predictable imports. Global styles belong in **`src/index.css`**; brand decisions belong in the shared token file.

## Use the wave

```tsx
import { GradientWave } from "@/components/ui/gradient-wave";
import { brandWave } from "@/lib/brand";

export function Cover() {
  return (
    <section className="relative isolate min-h-[32rem] overflow-hidden">
      <GradientWave {...brandWave} />
      <div className="relative z-10 max-w-xl bg-background/95 p-12">
        <h1 className="font-serif text-6xl">Your introduction</h1>
      </div>
    </section>
  );
}
```

The parent needs a height and `position: relative`. The canvas sizes to its container, including on mobile and when a panel changes size. Text should sit on a sufficiently opaque surface; do not rely on an animated color staying light or dark.

| Prop                           | Behavior                                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colors`                       | 1–8 valid `#RGB` or `#RRGGBB` colors; a single color becomes a solid field; an empty/invalid list uses the original default; extra colors are capped at eight |
| `isPlaying`                    | Requests playback; `false` still renders a composed frame                                                                                                     |
| `className`                    | Additional Tailwind classes, merged through `cn()`                                                                                                            |
| `shadowPower`, `darkenTop`     | Optional top shading; the brand preset leaves this off                                                                                                        |
| `noiseSpeed`, `noiseFrequency` | Global animation speed and spatial frequency                                                                                                                  |
| `deform`                       | Incline, offsets, noise frequency, amplitude, speed, flow, and seed                                                                                           |
| `grain`                        | Added static film texture, clamped to 0–0.15; brand preset is 0.025                                                                                           |

No state provider, icon library, image, or third-party animation engine is needed by `GradientWave`. It uses React hooks and browser WebGL. The surrounding landing page uses local React state for playback, theme, and the complete Telugu reveal. Lucide supplies interface icons; Radix Slot, CVA, clsx, and tailwind-merge support the shared button component.

The integration keeps the supplied simplex-noise and plane-deformation approach while replacing dynamic GPU plumbing with typed resource ownership. It repairs the malformed shader string, six-color indexing against a four-entry vector, replacement of uniform objects by raw deformation values, viewport-only sizing, and missing resize/resource cleanup. Numeric settings update existing uniforms; equal-value arrays and objects do not recreate the canvas. A palette change recompiles the bounded color shader.

Reduced motion produces a still frame. Offscreen canvases and hidden tabs pause. Device pixel ratio and mesh density are capped. Shader/context failures display the matching CSS gradient. Context restoration rebuilds GPU resources, and unmount disconnects observers, removes listeners, cancels animation, and frees the context. The canvas is decorative and excluded from the accessibility tree.

## shadcn and Tailwind setup

This project is already configured with React, TypeScript, Tailwind v4's Vite plugin, `components.json`, path aliases, and semantic theme variables. To add a component:

```sh
npx shadcn@latest add card
```

For a **new, separate project**, the current shadcn CLI can scaffold Vite:

```sh
npx shadcn@latest init -t vite
```

Or create React/TypeScript with Vite, install Tailwind, configure `@tailwindcss/vite` in `vite.config.ts`, add `@import "tailwindcss";` to the global CSS, configure the `@/` alias, then run `npx shadcn@latest init`. Set the UI alias to `@/components/ui` before adding components. Do not rerun initialization over this project's brand styles.

Official setup references: [shadcn Vite](https://ui.shadcn.com/docs/installation/vite), [Tailwind with Vite](https://tailwindcss.com/docs/installation/using-vite), [Vite](https://vite.dev/guide/).

## Design references and assets

The direction adapts [Sarvam's brand story](https://www.sarvam.ai/brand) and [Doc Agents page](https://www.sarvam.ai/products/doc-agents): architectural repetition, layered scallops, expressive headings, and a blue-to-orange spectrum. Courtyard's palette values and SVG geometry are original proposed adaptations, not official brand assets.

The Google Fonts families are stored locally with their SIL Open Font License texts in `design-crate/fonts/`. Samarkan was downloaded from the [user-selected FontMagic page](https://www.fontmagic.com/samarkan.font); its original source attribution is retained alongside the font. The architectural reference photograph in `public/images/architecture.jpg` comes from [this Unsplash image](https://images.unsplash.com/photo-1564507592333-c60657eea523). No remote assets are needed at runtime.

## Generated scrapbook artwork

The built-in `image_gen` tool generated the paper texture, warm gateway collage, indigo rosette, and top paper toran. Optimized, alpha-preserving WebP assets are in `public/images/scrapbook/`. Original PNGs and exact prompts are in `design-crate/generated/`, including `prompts.txt`. The toran prompt and mode are recorded in `design-crate/generated/top-paper-toran-prompt.txt`. Generated logo explorations are retained there for reference; the landing page uses a text-only Jo mark.

The same tool generated five full-bleed miniature worlds, optimized in `public/images/card-worlds/`. Their original PNGs and exact prompt set are retained in `design-crate/generated/card-worlds/`. The scenes use Indian architectural frames, foreground-to-horizon depth, tactile paper, and the established indigo/clay/marigold palette. Earlier isolated cutout illustrations remain archived in `design-crate/generated/cards/` and `public/images/cards/`.

`components/ui/ink-reveal.tsx` owns the reusable two-layer ink reveal. It uses a bounded set of SVG mask shapes and only schedules frames while a pointer is active or a trail is dissolving. Pointer cancellation, resize, document hiding, reduced motion, and unmount clear the relevant animation work.
