# Jo — scrapbook landing page

The landing page extends the [Courtyard design brief](design-crate/design-brief.txt) and [visual guide](design-crate/index.html). A clear personal greeting sits within tactile, Indian-inspired paper collage.

## Composition and material

- Center “Namaste” above “I'm Jo.” Make “Namaste” smaller and “I’m Jo” larger. Keep Jo as simple text in the greeting.
- Use generated cotton-rag paper, visible fiber, printing noise, worn edges, and small ledger-paper fragments as the stationary background.
- Place generated layered gateways and a scalloped rosette at the edges, clear of the central reading area. A shallow toran-inspired collage of torn block-printed strips, scallops and folded fans hangs from the top edge. Keep the original cutout transparency.
- Tape small handwritten notes among the collage pieces. Keep the main copy brief.
- Carry indigo, clay, faded periwinkle and marigold through the imagery. The landing surface is warm cream (`#F3EBDC`); text uses the shared semantic palette.
- Keep the existing brand wave faint beneath the collage. The paper texture itself does not move.

## Typography

Samarkan is the requested typeface for the Latin “Namaste.” The alternate greeting is **నమస్కారం** (Namaskaram), set in Tiro Telugu with `lang="te"`.

Samarkan supplies “Jo” as well as “Namaste,” giving both the requested Hindi-inspired English letterforms. Keep Jo as a simple clay-colored text mark, with no extra symbol or header logo. Eczar supplies only “I’m” in an upright medium weight. Kalam remains on the small paper notes and chapter placeholder, while Anek Latin supplies controls and supporting copy. UI/UX Pro Max’s editorial, visual-hierarchy and motion guidance informed the refinement; the existing palette and personal scrapbook direction take precedence over generic template recommendations.

Fonts are local. The Google Fonts families include their SIL Open Font License texts. Samarkan is the normal font from the user-specified FontMagic page; its original source attribution is retained in `design-crate/fonts/Samarkan-SOURCE.txt`.

## Greeting interaction

The flowing reveal on [Lando Norris's site](https://landonorris.com/) informs the interaction: an irregular, connected cursor trail uncovers the alternate layer and recedes.

- Start with English “Namaste”; brushing across it reveals Telugu **నమస్కారం** in clay.
- Ink pools merge along the pointer's path and dissolve over roughly one second after it leaves.
- Click, tap, Enter, or Space toggles the complete reveal. Escape restores English.
- Use complementary SVG masks, a bounded pool of trail points, and animation-frame updates. Stop scheduling frames once the trail clears.
- Keep a visible focus ring, accessible action labels, and a polite announcement on complete reveal.
- Reduced motion shows an immediate alternate state without a moving trail.

## Collage entrance

The paper background remains stationary and is preloaded. Only the separate paper cutouts and notes enter. Wait for their image decoding, then stagger the entrances.

Each piece advances in short, rigid steps, alternating sideways and vertical movement with held poses and small rotations. This should look like scraps crawling into position, not floating or easing along one straight path. Each entrance runs once, takes about 1.2–1.85 seconds, and settles. The final piece finishes around 2.35 seconds after readiness. Reduced motion removes these entrances entirely.

## Assets

The built-in image-generation tool produced the selected artwork. Original PNGs and exact prompts are retained in `design-crate/generated/`; optimized web copies preserve alpha where appropriate.

| Active asset                                   | Role                                      |
| ---------------------------------------------- | ----------------------------------------- |
| `public/images/scrapbook/scrapbook-paper.webp` | Stationary paper surface                  |
| `public/images/scrapbook/gateway-collage.webp` | Warm gateway, steps, and wave cutout      |
| `public/images/scrapbook/indigo-rosette.webp`  | Cool scalloped rosette and paisley cutout |
| `public/images/scrapbook/top-paper-toran.webp` | Layered top-edge ornament and hanging paper ribbons |

Generated logo explorations are archived in `design-crate/generated/` and are not used by the page.

## Collection cards

Dock five playing cards at the bottom of a fixed, single-screen landing page: **Music → Projects → Experience → Inspiration → About Me**. Keep a shallow bell-shaped fan with Experience highest and in front, small rotations, and slight overlap. Center the fan in the open space between the edge collages: above 1050px, shift its center right by 3.3vw (24–64px) to balance the heavier bottom-left gateway. At tablet and phone widths use equal inline margins and the viewport center. Layer the cards symmetrically toward the center (3, 4, 5, 4, 3), so the fan has a clear central anchor. Top titles remain exposed on both sides. About 205px of the cards is visible on a large screen; smaller viewports use proportionate peeks. This keeps the greeting dominant. The gateway collage sits in the bottom-left corner, sized at 31vw so it stays an accent and doesn't compete with the greeting.

Place Samarkan titles horizontally at the **top**, with a little clear space around the lettering. Keep every title visible, including when another card lifts. Use muted blue, terracotta, ochre, dusty rose and sage card stock with grain, fine inset rules, and playing-card ranks and suits. Do not use stark white faces.

Each card contains an arched window into an immersive generated world. Music has a listening courtyard and vinyl sun; Projects has a maker's city; Experience has a winding staircase and distant landscape; Inspiration has a surreal celestial garden; About Me has a quiet reading courtyard and journal. The illustrations use foreground framing, middle-distance architecture, distant horizons, tactile paper layers, block printing and the existing Indian-inspired palette. These are category metaphors, not biographical claims.

Hover or keyboard focus raises a card far enough to see its complete window. React Bits **Holo Card** adds low-intensity gold foil and a small pointer-driven tilt, preserving the colored paper, title and illustration. Foil is quiet at rest and stronger under the cursor; it stops scheduling frames after settling.

Click, tap, Enter, or Space crumples the entire selected card, including its title and frame, then drops the bundle below the screen over roughly 720ms. A tightly folded page rises from that same slot to the center over 720ms, then **uncrumples from a 3D paper sheet** over roughly 1.05 seconds. Keep the page folded during its ascent; only expand it after it reaches the center. Use React Bits **Paper Crumple**’s triangulated geometry, crease simulation, normal smoothing and lighting. A texture captured from the actual page carries the illustration and text through the folds. Once flat, switch to the live DOM without fading the artwork. Closing gathers the page into a paper bundle, then tumbles it down toward the selected card’s slot over roughly 1.25 seconds. The bundle shrinks as it falls and exits below the viewport; only then does the original card scoot back up. Fade the backdrop during the fall so the landing place is visible.

The entire playing card—including its title, border and image—is one draggable paper object. The toran, gateway, rosette and open chapter artwork are also grabbable. Hold for 180ms or move more than 6px to begin; an ordinary click still opens the card. Crumple while held, track the picked point, then flatten and return to the original place on release. Disable native drag previews, image dragging and text selection on these objects. Keep the base paper texture stationary. Keyboard users can hold Space on standalone artwork, or Alt+Space on a card, and use arrows to move it.

Use one on-demand paper renderer per active grab; precompute fold geometry in a worker and cache common aspect ratios. Cancel interactions on Escape, blur, pointer cancellation or resize. Dispose WebGL resources on completion. Reduced motion removes deformation and animated return. Unavailable WebGL retains original content and direct chapter navigation. Radix Dialog contains focus during page transitions and restores it to the selected card afterward. The background wave pauses while a chapter or paper grab is active.

The **Jo ID badge is deliberately modern**: neutral white/gray card, clean DM Sans type, a black woven strap, silver hardware and one small blue accent. It uses no Indian ornamental pattern. The Lanyard physics stage spans the viewport while only the projected badge receives pointer events, letting visitors drag it anywhere without covering other controls. The strap remains anchored at the top left. Use a large badge on desktop and reduce its size on short screens so it clears the greeting. Click or Enter/Space flips it; Escape resets it. Place the theme and background-motion controls together at the top right.

Adapted sources: [Paper Crumple](https://reactbits.dev/micro/paper-crumple), [Holo Card](https://reactbits.dev/components/holo-card), [Lanyard](https://reactbits.dev/components/lanyard), [Tear Ticket](https://reactbits.dev/micro/tear-ticket), [Fold Text](https://reactbits.dev/text-animations/fold-text), [Count Up](https://reactbits.dev/text-animations/count-up), and [Circular Text](https://reactbits.dev/text-animations/circular-text). [Gooey](https://libraries.dev/gooey.html) comes from libraries.dev as an npm package. Preserve source credits and `public/licenses/react-bits.md`.

The top ornament was generated with the built-in image tool. Its original is `design-crate/generated/top-paper-toran.png`; its exact prompt and generation mode are in `design-crate/generated/top-paper-toran-prompt.txt`. The transparent WebP is 1400px wide. It shares the stationary paper's materials and palette, and enters once with the other separate scraps.

Active full-bleed artwork is in `public/images/card-worlds/` as `music.webp`, `projects.webp`, `experience.webp`, `inspiration.webp`, and `about-me.webp`. The built-in image-generation tool produced the new scenes. Original PNGs and exact prompts are in `design-crate/generated/card-worlds/`. The previous isolated cutout illustrations are retained in `design-crate/generated/cards/` and `public/images/cards/` as explorations.

## Chapter pages

A chapter is a paper collage with one physical toy on it, not a formatted resume. The arch from the card survives only as a plate about 190px wide in a side rail. Landing card arches are unchanged.

- **Material:** a torn sheet lies on the card stock, over a ledger scrap and a coloured under-sheet that peek out at slightly different angles. The rosette and gateway cutouts are tucked over its corners and can be grabbed and crumpled. They are hidden below 1280px, where the margins can't hold them clear of the content.
- **Torn edges:** `lib/paper/torn-edge.ts` builds CSS polygons with px offsets on percentage positions, so the grain holds at any size. Each piece has a pale fibre layer behind a slightly deeper tear.
- **Content:** everything is in `lib/chapters.ts` and comes from the resume. Music and Inspiration have no source material, so their toys carry the page. Filling `records` or `pins` adds real entries alongside them. Don't invent entries.
- **Privacy:** the phone number and resume PDF are deliberately not published.

| Chapter | The toy | Source |
| ---------- | -------------------------------------------------------------- | -------------------- |
| Projects | A wall of torn sheets at different sizes, each with a picture and one big number. Sheets lean toward the pointer and their neighbours make room. Clicking one opens its full-screen page | React Bits Count Up, Fold Text, Click Spark |
| Experience | Torn strips in a ledger, grouped into Now, Before and Alongside. A picture tucked into each strip pops out under the pointer. Clicking one opens its full-screen page | React Bits Count Up, Fold Text, Click Spark |
| About Me | Peelable award stickers that can go anywhere on the page, a name that swells under the cursor, a spinning stamp to fling, a toolkit that collapses into a pile you can throw, and a ticket to tear | React Bits Sticker Peel, Variable Proximity, Circular Text, Falling Text, Tear Ticket |
| Music | A paper turntable that plays real 30-second previews of Jo's Spotify top 40. Its tonearm tracks progress, the platter spins down when paused, and the record can be scratched by hand. Beside it, a crate of sleeves whose records peek out on hover, liner notes, and the playable harmonium below | React Bits Circular Text, Elastic Slider; previews and artwork from Apple's iTunes Search API |
| Inspiration | A working shredder fed with joke placeholder notes, and a trail of art scraps following the cursor | React Bits Shredder, Image Trail |
| All | Headlines fold open and crease near the cursor, paper confetti on every click, contact links are an ink blot on a magnet | React Bits Fold Text, Click Spark, Magnet, `liquid-gooey` |

**Motion:** paper has weight, so pieces overshoot and settle rather than fading in. The texture captured for the unfold is the empty sheet: chapter content mounts only once the paper is flat, then drops, slaps or slides onto it. Closing sweeps everything off in 260ms before the sheet crumples, so the page and the texture match.

**Landing:** hovering a card makes its neighbours lean out of the way, "I'm Jo." swells under the cursor, and clicks throw confetti.

**WebGL:** at most about 12 contexts are live, on About Me with its three stickers, under Chrome's limit of 16. Chapter code is a separate chunk, preloaded 1.5 seconds after load or on card hover.

**Full-screen pages:** a project or job grows out of the sheet that was clicked, with its picture flying into place. The page has a hero, a torn band of big numbers, the facts, and pictures that crumple when held. Next and previous page through the set, by button or arrow key. It is a nested dialog, so Escape returns to the chapter rather than closing it, and focus returns to the sheet for whichever entry was showing. Real facts live in `lib/chapters.ts`. Filler in `lib/chapter-details.ts` carries a visible placeholder tag, so unconfirmed text and stand-in art can't pass as the real thing.

**Accessibility:** project sheets, job strips and the Tear Ticket stub are focusable and respond to Enter or Space, the harmonium keys are buttons, and shredder notes are focusable. Sticker and toolkit content is also available as text. Reduced motion removes the entrance animations.

## Responsive behavior

Keep the page within the viewport, with no horizontal or vertical document scrolling. Adapt the greeting and card peek to the available height. Crop edge decoration more tightly on short screens. All five titles remain visible on phones; an open chapter fills the viewport, including short landscape screens. On phones the rail folds into a header row and the whole page scrolls as one. Controls occupy the top corners, leaving the card fan clear. Keep noninteractive decoration out of the accessibility tree; label grabbable artwork and the ID badge. Retain daylight/evening modes.

## References

[Sarvam brand](https://www.sarvam.ai/brand) and [Doc Agents](https://www.sarvam.ai/products/doc-agents) inform the architectural repetition and palette relationships. The generated artwork and existing Courtyard SVGs are original interpretations, not Sarvam assets. Typeface sources: [Samarkan](https://www.fontmagic.com/samarkan.font), [Tiro Telugu](https://github.com/google/fonts/tree/main/ofl/tirotelugu), [Eczar](https://github.com/rosettatype/Eczar), [Kalam](https://github.com/google/fonts/tree/main/ofl/kalam), [Anek Latin](https://github.com/google/fonts/tree/main/ofl/aneklatin).
