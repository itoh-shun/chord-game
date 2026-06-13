// Tone.js を使ったコード進行再生エンジン (クライアント専用)

import type * as ToneType from "tone";

/** 再生する1ステップ(=1小節) */
export type PlayStep = {
  /** Tone.js用音名配列 例: ["C4","E4","G4"] */
  notes: string[];
  /** 表示用コード名 */
  label: string;
};

let Tone: typeof ToneType | null = null;
let synth: ToneType.PolySynth | null = null;
let scheduledIds: number[] = [];
let isPlaying = false;

async function ensureTone() {
  if (!Tone) {
    Tone = await import("tone");
  }
  await Tone.start();
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.8 },
    }).toDestination();
    synth.volume.value = -8;
  }
  return Tone;
}

export type PlayHandlers = {
  /** ステップ開始ごとに呼ばれる (highlight用) */
  onStep?: (index: number) => void;
  /** 全再生終了時に呼ばれる */
  onEnd?: () => void;
};

/**
 * コード進行を再生する。1ステップ = 1小節 (4拍)。
 */
export async function playProgression(
  steps: PlayStep[],
  bpm: number,
  handlers: PlayHandlers = {},
): Promise<void> {
  if (steps.length === 0) return;
  const t = await ensureTone();
  stopProgression(); // 念のため既存をクリア

  t.Transport.bpm.value = bpm;
  const barSeconds = (60 / bpm) * 4;
  const startTime = t.now() + 0.1;
  isPlaying = true;

  steps.forEach((step, i) => {
    const at = startTime + i * barSeconds;
    if (step.notes.length > 0) {
      synth!.triggerAttackRelease(step.notes, barSeconds * 0.95, at);
    }
    const id = t.Transport.scheduleOnce(() => {
      handlers.onStep?.(i);
    }, `+${i * barSeconds}`);
    scheduledIds.push(id);
  });

  const endId = t.Transport.scheduleOnce(() => {
    isPlaying = false;
    handlers.onEnd?.();
  }, `+${steps.length * barSeconds}`);
  scheduledIds.push(endId);

  t.Transport.start();
}

/** 再生を停止する */
export function stopProgression(): void {
  if (!Tone) return;
  scheduledIds.forEach((id) => Tone!.Transport.clear(id));
  scheduledIds = [];
  Tone.Transport.stop();
  Tone.Transport.cancel();
  if (synth) synth.releaseAll();
  isPlaying = false;
}

export function getIsPlaying(): boolean {
  return isPlaying;
}
