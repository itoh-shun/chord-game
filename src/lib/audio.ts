// Tone.js を使ったコード進行＋ドラム再生エンジン (クライアント専用)
// ジャンルに合わせて音色と奏法(ストローク/刻み/コンプ等)を切り替える。

import type * as ToneType from "tone";

/** 再生する1ステップ(=1小節) */
export type PlayStep = {
  /** Tone.js用音名配列 例: ["C4","E4","G4"] */
  notes: string[];
  /** 表示用コード名 */
  label: string;
};

export type InstrumentId =
  | "piano"
  | "eguitar"
  | "aguitar"
  | "epiano"
  | "synth"
  | "synthbright";

type Voice = {
  /** リリース用 (停止時に音を消す) */
  poly: ToneType.PolySynth;
  /** 1小節分を奏法に沿って鳴らす */
  playBar: (notes: string[], time: number, bar: number, beat: number) => void;
};

let Tone: typeof ToneType | null = null;
let kick: ToneType.MembraneSynth | null = null;
let snare: ToneType.NoiseSynth | null = null;
let hihat: ToneType.NoiseSynth | null = null;
const voices: Partial<Record<InstrumentId, Voice>> = {};
let isPlaying = false;

/** 和音を弦のように少しずらして鳴らす(ストローク) */
function strum(
  poly: ToneType.PolySynth,
  notes: string[],
  time: number,
  dur: number,
  up: boolean,
  spread = 0.018,
) {
  const order = up ? [...notes].reverse() : notes;
  order.forEach((n, i) => poly.triggerAttackRelease(n, dur, time + i * spread));
}

function makeVoice(t: typeof ToneType, id: InstrumentId): Voice {
  switch (id) {
    case "eguitar": {
      // ロック: 歪んだサウンドを8分で刻む
      const dist = new t.Distortion(0.45).toDestination();
      const poly = new t.PolySynth(t.Synth, {
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.005, decay: 0.18, sustain: 0.4, release: 0.15 },
      });
      poly.connect(dist);
      poly.volume.value = -16;
      return {
        poly,
        playBar: (notes, time, _bar, beat) => {
          const eighth = beat / 2;
          for (let k = 0; k < 8; k++) {
            strum(poly, notes, time + k * eighth, eighth * 0.6, false, 0.008);
          }
        },
      };
    }
    case "aguitar": {
      // 弾き語り: アコギのストローク(ダウン/アップ)
      const poly = new t.PolySynth(t.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.004, decay: 0.5, sustain: 0.15, release: 0.5 },
      });
      poly.volume.value = -10;
      return {
        poly,
        playBar: (notes, time, _bar, beat) => {
          // ダ・ダダ・ダ のよくあるストロークパターン
          strum(poly, notes, time, beat * 0.9, false);
          strum(poly, notes, time + beat, beat * 0.5, false);
          strum(poly, notes, time + beat * 1.5, beat * 0.5, true);
          strum(poly, notes, time + beat * 2.5, beat * 0.5, true);
          strum(poly, notes, time + beat * 3, beat * 0.9, false);
        },
      };
    }
    case "epiano": {
      // シティポップ/ジャズ: エレピでコンプ(2拍ごとの刻み)
      const chorus = new t.Chorus(2.5, 1.8, 0.4).toDestination().start();
      const poly = new t.PolySynth(t.FMSynth, {
        harmonicity: 2,
        modulationIndex: 6,
        oscillator: { type: "sine" },
        envelope: { attack: 0.005, decay: 0.6, sustain: 0.25, release: 0.6 },
        modulation: { type: "sine" },
        modulationEnvelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.3 },
      });
      poly.connect(chorus);
      poly.volume.value = -12;
      return {
        poly,
        playBar: (notes, time, _bar, beat) => {
          poly.triggerAttackRelease(notes, beat * 1.4, time);
          poly.triggerAttackRelease(notes, beat * 1.4, time + beat * 2);
        },
      };
    }
    case "synth":
    case "synthbright": {
      // EDM/ボカロ/アニソン: 太いシンセを伸ばす(明るめはオクターブ重ね)
      const reverb = new t.Reverb(1.6).toDestination();
      const poly = new t.PolySynth(t.Synth, {
        oscillator: { type: id === "synthbright" ? "fatsawtooth" : "fatsquare" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.4 },
      });
      poly.connect(reverb);
      poly.volume.value = id === "synthbright" ? -18 : -16;
      return {
        poly,
        playBar: (notes, time, bar) => {
          poly.triggerAttackRelease(notes, bar * 0.98, time);
        },
      };
    }
    case "piano":
    default: {
      // J-POP/デフォルト: やわらかいブロックコード
      const poly = new t.PolySynth(t.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.01, decay: 0.4, sustain: 0.4, release: 0.8 },
      });
      poly.toDestination();
      poly.volume.value = -10;
      return {
        poly,
        playBar: (notes, time, bar) => {
          poly.triggerAttackRelease(notes, bar * 0.95, time);
        },
      };
    }
  }
}

async function ensureTone() {
  if (!Tone) {
    Tone = await import("tone");
  }
  await Tone.start();
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

function getVoice(t: typeof ToneType, id: InstrumentId): Voice {
  if (!voices[id]) voices[id] = makeVoice(t, id);
  return voices[id]!;
}

export type PlayHandlers = {
  onStep?: (index: number) => void;
  onEnd?: () => void;
};

export type PlayOptions = {
  /** ドラムを鳴らすか */
  drums?: boolean;
  /** 使用する楽器 */
  instrument?: InstrumentId;
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
  stopProgression();

  t.Transport.bpm.value = bpm;
  const beatSeconds = 60 / bpm;
  const barSeconds = beatSeconds * 4;
  const voice = getVoice(t, options.instrument ?? "piano");
  isPlaying = true;

  // コード(1小節ごと、ジャンルの奏法で) + ハイライト
  steps.forEach((step, i) => {
    t.Transport.schedule((time) => {
      if (step.notes.length > 0) {
        voice.playBar(step.notes, time, barSeconds, beatSeconds);
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
        if (inBar === 0 || inBar === 2) kick!.triggerAttackRelease("C1", "8n", time);
        if (inBar === 1 || inBar === 3) snare!.triggerAttackRelease("16n", time);
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
  Object.values(voices).forEach((v) => v?.poly.releaseAll());
  isPlaying = false;
}

export function getIsPlaying(): boolean {
  return isPlaying;
}

/** ジャンル(と店長ジャンルカード)から楽器を決める */
export function pickInstrument(
  genre: string,
  special?: { id: string; type: string },
): { id: InstrumentId; label: string } {
  // 店長の「ジャンル寄せ」カードがあれば音色も寄せる
  if (special && special.type === "genre") {
    switch (special.id) {
      case "sp_ballad":
        return { id: "aguitar", label: "弾き語り(アコギ)" };
      case "sp_citypop":
        return { id: "epiano", label: "エレピ" };
      case "sp_anison":
        return { id: "synthbright", label: "ブライトシンセ" };
      case "sp_jpop90s":
        return { id: "piano", label: "ピアノ" };
    }
  }
  switch (genre) {
    case "ロック":
      return { id: "eguitar", label: "エレキギター" };
    case "シティポップ":
      return { id: "epiano", label: "エレピ" };
    case "ジャズ":
      return { id: "epiano", label: "エレピ" };
    case "EDM":
      return { id: "synth", label: "シンセ" };
    case "ボカロ":
      return { id: "synthbright", label: "ブライトシンセ" };
    case "アニソン":
      return { id: "synthbright", label: "ブライトシンセ" };
    case "J-POP":
      return { id: "piano", label: "ピアノ" };
    default:
      return { id: "piano", label: "ピアノ" };
  }
}
