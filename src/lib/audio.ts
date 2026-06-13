// Tone.js を使ったコード進行＋ドラム再生エンジン (クライアント専用)

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
let kick: ToneType.MembraneSynth | null = null;
let snare: ToneType.NoiseSynth | null = null;
let hihat: ToneType.NoiseSynth | null = null;
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
    synth.volume.value = -9;
  }
  if (!kick) {
    kick = new Tone.MembraneSynth({
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0 },
    }).toDestination();
    kick.volume.value = -3;
  }
  if (!snare) {
    snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
    }).toDestination();
    snare.volume.value = -12;
  }
  if (!hihat) {
    const hpf = new Tone.Filter(7000, "highpass").toDestination();
    hihat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0 },
    });
    hihat.connect(hpf);
    hihat.volume.value = -20;
  }
  return Tone;
}

export type PlayHandlers = {
  /** ステップ開始ごとに呼ばれる (highlight用) */
  onStep?: (index: number) => void;
  /** 全再生終了時に呼ばれる */
  onEnd?: () => void;
};

export type PlayOptions = {
  /** ドラムを鳴らすか */
  drums?: boolean;
};

/**
 * コード進行を再生する。1ステップ = 1小節 (4拍)。
 * すべて Transport タイムライン上にスケジュールするので、stop で確実に止まる。
 */
export async function playProgression(
  steps: PlayStep[],
  bpm: number,
  handlers: PlayHandlers = {},
  options: PlayOptions = {},
): Promise<void> {
  if (steps.length === 0) return;
  const t = await ensureTone();
  stopProgression(); // 念のため既存をクリア

  t.Transport.bpm.value = bpm;
  const beatSeconds = 60 / bpm;
  const barSeconds = beatSeconds * 4;
  isPlaying = true;

  // コード(1小節ごと) + ハイライト
  steps.forEach((step, i) => {
    t.Transport.schedule((time) => {
      if (step.notes.length > 0) {
        synth!.triggerAttackRelease(step.notes, barSeconds * 0.95, time);
      }
      t.Draw.schedule(() => handlers.onStep?.(i), time);
    }, i * barSeconds);
  });

  // 簡単なドラム (キック=1,3拍 / スネア=2,4拍 / ハイハット=8分)
  if (options.drums !== false) {
    const totalBeats = steps.length * 4;
    for (let beat = 0; beat < totalBeats; beat++) {
      const inBar = beat % 4;
      t.Transport.schedule((time) => {
        if (inBar === 0 || inBar === 2) {
          kick!.triggerAttackRelease("C1", "8n", time);
        }
        if (inBar === 1 || inBar === 3) {
          snare!.triggerAttackRelease("16n", time);
        }
        hihat!.triggerAttackRelease("32n", time);
        hihat!.triggerAttackRelease("32n", time + beatSeconds / 2);
      }, beat * beatSeconds);
    }
  }

  // 終了
  t.Transport.schedule((time) => {
    t.Draw.schedule(() => {
      isPlaying = false;
      handlers.onEnd?.();
    }, time);
  }, steps.length * barSeconds);

  t.Transport.start();
}

/** 再生を停止する */
export function stopProgression(): void {
  if (!Tone) return;
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  if (synth) synth.releaseAll();
  isPlaying = false;
}

export function getIsPlaying(): boolean {
  return isPlaying;
}
