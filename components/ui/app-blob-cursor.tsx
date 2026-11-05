import { lazy, Suspense, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const BlobCursor = lazy(() => import("./blob-cursor"));
const cursorMedia = "(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference)";
const canShowCursor = () => window.matchMedia(cursorMedia).matches;
const serverSnapshot = () => false;

function subscribe(onChange: () => void) {
  const media = window.matchMedia(cursorMedia);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function AppBlobCursor() {
  const enabled = useSyncExternalStore(subscribe, canShowCursor, serverSnapshot);
  if (!enabled) return null;

  // Keep the cursor outside the landing page's isolated stacking context so
  // the same instance remains above the chapter dialogs rendered into body.
  return createPortal(
    <Suspense fallback={null}>
      <BlobCursor
        className="app-blob-cursor"
        material="ink"
        color="#ffffff"
        blend="difference"
        size={42}
        trail={12}
        lag={0.15}
        stretch={0.45}
        wobble={0.45}
        splashCount={4}
        splashSize={0.25}
        splashSpeed={0.25}
      />
    </Suspense>,
    document.body,
  );
}
