import { GradientWave } from "@/components/ui/gradient-wave";
import { brandWave } from "@/lib/brand";

export default function DemoOne() {
  return (
    <div className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden">
      <GradientWave {...brandWave} />
      <h1 className="relative z-10 rounded-3xl bg-background/90 p-8 text-center font-serif text-7xl tracking-tight text-foreground">
        Gradient Wave
      </h1>
    </div>
  );
}
