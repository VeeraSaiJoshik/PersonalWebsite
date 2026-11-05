import type { GradientWaveProps } from "@/components/ui/gradient-wave";

/** Same color family as the SVGs; shared by the landing page and motion demo. */
export const brandColors = [
  "#DDE6F2",
  "#9CAAF0",
  "#EBC6B2",
  "#EA873D",
] as const;
export const brandWave = {
  colors: brandColors,
  noiseSpeed: 0.000004,
  noiseFrequency: [0.00012, 0.00024],
  grain: 0.025,
  darkenTop: false,
  deform: {
    incline: 0.12,
    noiseAmp: 105,
    noiseFlow: 2.2,
    noiseSpeed: 5,
    noiseSeed: 8,
    noiseFreq: [2.2, 3],
  },
} as const satisfies GradientWaveProps;
