import { lazy, Suspense, useEffect, useState } from "react";
const Lanyard = lazy(() => import("./lanyard"));
let cardFaces: Promise<{ front: string; back: string }> | undefined;
function identityArtwork() {
  return cardFaces ??= (async () => {
    await document.fonts.load('120px "DM Sans"');
    const make = () => { const c = document.createElement("canvas"); c.width = 1000; c.height = 1400; return c; };
    const front = make(), ctx = front.getContext("2d")!;
    ctx.fillStyle = "#f7f7f5"; ctx.fillRect(0, 0, 1000, 1400);
    ctx.fillStyle = "#17191c"; ctx.font = '600 35px "DM Sans"'; ctx.fillText("PERSONAL / 001", 90, 170);
    ctx.beginPath(); ctx.arc(887, 155, 15, 0, Math.PI * 2); ctx.fillStyle = "#5279ff"; ctx.fill();
    const gradient = ctx.createLinearGradient(80, 300, 920, 1000);
    gradient.addColorStop(0, "#e3e5e8"); gradient.addColorStop(1, "#f1f2f3");
    ctx.fillStyle = gradient; ctx.fillRect(80, 260, 840, 740);
    ctx.fillStyle = "#17191c"; ctx.font = '700 430px "DM Sans"'; ctx.textAlign = "center"; ctx.fillText("jo", 470, 790);
    ctx.textAlign = "left"; ctx.font = '600 86px "DM Sans"'; ctx.fillText("Jo", 80, 1125);
    ctx.fillStyle = "#686b72"; ctx.font = '400 35px "DM Sans"'; ctx.fillText("Music. Projects. Ideas.", 80, 1190);
    ctx.fillStyle = "#17191c";
    let bx = 80;
    for (let i = 0; i < 55; i++) { const w = [3, 7, 2, 5, 9][i % 5]; ctx.fillRect(bx, 1275, w, 52); bx += w + 5; }
    ctx.textAlign = "right"; ctx.font = '400 28px "DM Sans"'; ctx.fillText("OPEN TO CURIOSITY", 920, 1310);
    const back = make(), b = back.getContext("2d")!;
    b.fillStyle = "#17191c"; b.fillRect(0, 0, 1000, 1400);
    b.fillStyle = "#f7f7f5"; b.font = '600 34px "DM Sans"'; b.fillText("WELCOME IN.", 85, 180);
    b.font = '600 112px "DM Sans"';
    ["Make yourself", "at home."].forEach((line, i) => b.fillText(line, 80, 430 + i * 145));
    b.fillStyle = "#a3a7af"; b.font = '400 46px "DM Sans"';
    ["01   Music", "02   Projects", "03   Experience", "04   Inspiration", "05   About Me"].forEach((line, i) => b.fillText(line, 85, 790 + i * 86));
    b.strokeStyle = "#4e525a"; b.beginPath(); b.moveTo(85, 1260); b.lineTo(915, 1260); b.stroke();
    b.fillStyle = "#f7f7f5"; b.font = '600 36px "DM Sans"'; b.fillText("JO / PERSONAL COLLECTION", 85, 1330);
    return { front: front.toDataURL("image/png"), back: back.toDataURL("image/png") };
  })();
}
export function IdentityLanyard({ paused }: { paused: boolean }) {
  const [faces, setFaces] = useState<{ front: string; back: string } | null>(null);
  useEffect(() => { let active = true; identityArtwork().then(value => { if (active) setFaces(value); }).catch(() => {}); return () => { active = false; }; }, []);
  return <aside className="identity-lanyard" aria-label="Jo’s ID card. A personal collection.">
    <div className="identity-fallback" aria-hidden="true"><span>Jo.</span><small>A little curiosity.</small></div>
    {faces && <Suspense fallback={null}><Lanyard frontImage={faces.front} backImage={faces.back} viewport cardColor="#f7f7f5" strapColor="#151619" metal="silver" finish="glossy" size={0.54} strapLength={0.28} strapWidth={0.55} cornerRadius={0.22} damping={0.8} elasticity={0.35} breeze={0} interactive={!paused} /></Suspense>}
  </aside>;
}
