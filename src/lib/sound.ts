// BLOOM — Tone.js サウンドエンジン(タップで心地よい音)

import type * as ToneType from "tone";

let Tone: typeof ToneType | null = null;
let synth: ToneType.PolySynth | null = null;
let bell: ToneType.PolySynth | null = null;
let panner: ToneType.Panner | null = null;
let ready = false;

export async function initAudio(): Promise<void> {
  if (ready) return;
  Tone = await import("tone");
  await Tone.start();

  const reverb = new Tone.Reverb({ decay: 7, wet: 0.55 }).toDestination();
  const delay = new Tone.FeedbackDelay({ delayTime: "8n.", feedback: 0.4, wet: 0.32 });
  delay.connect(reverb);
  panner = new Tone.Panner(0).connect(delay);

  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.015, decay: 0.5, sustain: 0.25, release: 2.4 },
  }).connect(panner);
  synth.volume.value = -12;

  bell = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3.0,
    modulationIndex: 8,
    oscillator: { type: "sine" },
    envelope: { attack: 0.005, decay: 1.2, sustain: 0, release: 1.8 },
    modulation: { type: "sine" },
    modulationEnvelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.4 },
  }).connect(panner);
  bell.volume.value = -20;

  ready = true;
}

export function isReady(): boolean {
  return ready;
}

/** ノートを鳴らす。pan=-1..1, soft で倍音ベルを軽く重ねる */
export function pluck(note: string, pan = 0): void {
  if (!ready || !synth || !panner) return;
  panner.pan.rampTo(Math.max(-1, Math.min(1, pan)), 0.04);
  synth.triggerAttackRelease(note, "2n");
  bell?.triggerAttackRelease(note, "8n");
}
