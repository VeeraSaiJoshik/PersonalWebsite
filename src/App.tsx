import { useEffect, useState } from "react";
import { Moon, Pause, Play, Sun } from "lucide-react";
import ClickSpark from "@/components/ui/click-spark";
import { GradientWave } from "@/components/ui/gradient-wave";
import VariableProximity from "@/components/ui/variable-proximity";
import { NamasteReveal } from "@/components/ui/namaste-reveal";
import { IdentityLanyard } from "@/components/ui/identity-lanyard";
import { PaperImage, PaperPlayProvider } from "@/components/ui/paper-play";
import { CollectionCardStack } from "@/components/ui/collection-card-stack";
import { brandWave } from "@/lib/brand";
import divider from "../design-crate/patterns/divider.svg";

const artwork = "/images/scrapbook/";

export default function App() {
  const [dark, setDark] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [artworkReady, setArtworkReady] = useState(false);
  const [chapterOpen, setChapterOpen] = useState(false);
  const [paperBusy, setPaperBusy] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    let cancelled = false;
    // Scoot the separate collage pieces in once their images are decoded.
    const assets = [
      "scrapbook-paper.webp",
      "gateway-collage.webp",
      "indigo-rosette.webp",
      "top-paper-toran.webp",
    ];
    Promise.allSettled(
      assets.map((name) => {
        const image = new Image();
        image.src = `${artwork}${name}`;
        return image.decode();
      }),
    ).then(() => {
      if (!cancelled) setArtworkReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    return () => {
      delete document.documentElement.dataset.theme;
    };
  }, [dark]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <PaperPlayProvider onBusyChange={setPaperBusy}>
    <ClickSpark sparkColor={["#c9663f", "#e2b04a", "#29435b", "#8b4a5e", "#5c7a52"]} shape="star" sparkCount={12} sparkSize={13} sparkRadius={56} gravity={0.7} randomness={0.6} duration={620}>
    <div className="jo-landing">
      <a className="skip-link" href="#hello">
        Skip to the greeting
      </a>
      <div className="landing-art" data-ready={artworkReady}>
        <div className="paper-stock" />
        <div className="ambient-wave">
          <GradientWave {...brandWave} isPlaying={playing && !chapterOpen && !paperBusy} />
        </div>
        <div className="paper-light" />
        <div className="scrap scrap-toran">
          <PaperImage
            label="Block-printed paper toran"
            src={`${artwork}top-paper-toran.webp`}
            alt=""
            width="1400"
            height="467"
          />
        </div>
        <div className="scrap scrap-gateway">
          <PaperImage
            label="Layered gateway collage"
            src={`${artwork}gateway-collage.webp`}
            alt=""
            width="1254"
            height="1254"
          />
        </div>
        <div className="scrap scrap-rosette">
          <PaperImage
            label="Indigo paper rosette"
            src={`${artwork}indigo-rosette.webp`}
            alt=""
            width="1254"
            height="1254"
          />
        </div>
        <div className="paper-seam" />
        <div className="page-frame" />
      </div>
      <IdentityLanyard paused={chapterOpen || paperBusy} />
      <header className="jo-header">
        <button
          className="quiet-control theme-control"
          type="button"
          aria-label={dark ? "Switch to daylight" : "Switch to evening"}
          aria-pressed={dark}
          onClick={() => setDark(!dark)}
        >
          {dark ? (
            <Sun size={16} strokeWidth={1.4} />
          ) : (
            <Moon size={16} strokeWidth={1.4} />
          )}
          <span>{dark ? "Evening" : "Daylight"}</span>
        </button>
      </header>
      <main id="hello" className="hello-main">
        <div className="greeting-composition">
          <h1 className="hello-heading" aria-label="Namaste. I'm Jo.">
            <NamasteReveal />
            <span className="name-line">
              <span aria-hidden="true" className="name-im">
                <VariableProximity
                  label="I'm"
                  fromFontVariationSettings="'wght' 500"
                  toFontVariationSettings="'wght' 800"
                  radius={240}
                  falloff="gaussian"
                  scale={1.2}
                  lift={0.08}
                />
              </span>
              <em className="jo-text" aria-hidden="true">
                <VariableProximity
                  label="Jo."
                  fromFontVariationSettings="'wght' 400"
                  toFontVariationSettings="'wght' 400"
                  radius={240}
                  falloff="gaussian"
                  scale={1.28}
                  lift={0.1}
                />
              </em>
            </span>
          </h1>
        </div>
        <p className="landing-hint" aria-hidden="true">pick a card</p>
        <CollectionCardStack onOpenChange={setChapterOpen} />
      </main>
      <footer className="jo-footer">
        <p className="footer-note">
          <span className="footer-dot" /> ROOTED IN CURIOSITY.
        </p>
        <img
          className="footer-flourish"
          src={divider}
          alt=""
          width="160"
          height="32"
        />
        <button
          type="button"
          className="quiet-control motion-control"
          onClick={() => setPlaying(!playing)}
          disabled={reducedMotion}
          aria-label={
            reducedMotion
              ? "Animation paused for reduced motion"
              : playing
                ? "Pause background animation"
                : "Resume background animation"
          }
          aria-pressed={!playing || reducedMotion}
        >
          {playing && !reducedMotion ? (
            <Pause size={13} strokeWidth={1.5} />
          ) : (
            <Play size={13} strokeWidth={1.5} />
          )}
          <span>
            {reducedMotion
              ? "A quiet moment"
              : playing
                ? "A little stillness"
                : "Let it move"}
          </span>
        </button>
      </footer>
    </div>
    </ClickSpark>
    </PaperPlayProvider>
  );
}
