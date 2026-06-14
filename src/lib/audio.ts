// Tone.js を使ったコード進行＋ドラム再生エンジン (クライアント専用)
// ジャンルに合わせて音色(サンプリング音源/シンセ)と奏法を切り替える。

import type * as ToneType from "tone";

/** 再生する1ステップ(1コード)。beats=長さ(拍) */
export type SongStep = {
  notes: string[];
  beats: number;
};

export type InstrumentId =
  | "piano"
  | "eguitar"
  | "aguitar"
  | "epiano"
  | "synth"
  | "synthbright";

/** triggerAttackRelease/releaseAll を持つ最小インターフェース */
type Playable = {
  triggerAttackRelease: (
    notes: string | string[],
    duration: number | string,
    time?: number,
  ) => unknown;
  releaseAll?: () => unknown;
};

type Voice = {
  node: Playable;
  /** サンプル読み込み完了を待つ Promise (シンセは即時) */
  ready?: Promise<void>;
  playBar: (notes: string[], time: number, bar: number, beat: number) => void;
};

const SAMPLE_BASE = (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/samples/";

let Tone: typeof ToneType | null = null;
let kick: ToneType.MembraneSynth | null = null;
let snare: ToneType.NoiseSynth | null = null;
let hihat: ToneType.NoiseSynth | null = null;
let crash: ToneType.NoiseSynth | null = null;
const voices: Partial<Record<InstrumentId, Voice>> = {};
let isPlaying = false;

/** 和音を弦のように少しずらして鳴らす(ストローク) */
function strum(
  node: Playable,
  notes: string[],
  time: number,
  dur: number,
  up: boolean,
  spread = 0.02,
) {
  const order = up ? [...notes].reverse() : notes;
  order.forEach((n, i) =>
    node.triggerAttackRelease(n, dur, time + i * spread),
  );
}

function makeSampler(
  t: typeof ToneType,
  folder: string,
  urls: Record<string, string>,
): { sampler: ToneType.Sampler; ready: Promise<void> } {
  let resolve!: () => void;
  const ready = new Promise<void>((r) => (resolve = r));
  const sampler = new t.Sampler({
    urls,
    baseUrl: `${SAMPLE_BASE}${folder}/`,
    release: 1,
    onload: () => resolve(),
  });
  return { sampler, ready };
}

function makeVoice(t: typeof ToneType, id: InstrumentId): Voice {
  switch (id) {
    case "piano": {
      const { sampler, ready } = makeSampler(t, "piano", {
        C2: "C2.mp3",
        "F#2": "Fs2.mp3",
        C3: "C3.mp3",
        "F#3": "Fs3.mp3",
        C4: "C4.mp3",
        "F#4": "Fs4.mp3",
        C5: "C5.mp3",
      });
      sampler.toDestination();
      sampler.volume.value = -6;
      return {
        node: sampler,
        ready,
        playBar: (notes, time, bar) =>
          sampler.triggerAttackRelease(notes, bar * 0.95, time),
      };
    }
    case "aguitar": {
      const { sampler, ready } = makeSampler(t, "guitar-acoustic", {
        A2: "A2.mp3",
        C3: "C3.mp3",
        "F#3": "Fs3.mp3",
        C4: "C4.mp3",
        "F#4": "Fs4.mp3",
        C5: "C5.mp3",
      });
      sampler.toDestination();
      sampler.volume.value = -6;
      return {
        node: sampler,
        ready,
        playBar: (notes, time, bar, beat) => {
          // 各拍ストローク(ダウン/アップ交互)
          const beats = Math.max(1, Math.round(bar / beat));
          for (let k = 0; k < beats; k++) {
            strum(sampler, notes, time + k * beat, beat * 0.85, k % 2 === 1);
          }
        },
      };
    }
    case "eguitar": {
      const dist = new t.Distortion(0.28).toDestination();
      const { sampler, ready } = makeSampler(t, "guitar-electric", {
        A2: "A2.mp3",
        C3: "C3.mp3",
        "F#3": "Fs3.mp3",
        C4: "C4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
      });
      sampler.connect(dist);
      sampler.volume.value = -8;
      return {
        node: sampler,
        ready,
        playBar: (notes, time, bar, beat) => {
          // 8分で刻む(コードの長さ分)
          const eighth = beat / 2;
          const n = Math.max(2, Math.round(bar / eighth));
          for (let k = 0; k < n; k++) {
            strum(sampler, notes, time + k * eighth, eighth * 0.7, false, 0.01);
          }
        },
      };
    }
    case "epiano": {
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
        node: poly,
        playBar: (notes, time, bar, beat) => {
          // 2拍ごとにコンプ
          const beats = Math.max(1, Math.round(bar / beat));
          for (let k = 0; k < beats; k += 2) {
            poly.triggerAttackRelease(notes, beat * 1.4, time + k * beat);
          }
        },
      };
    }
    case "synth":
    case "synthbright": {
      const reverb = new t.Reverb(1.6).toDestination();
      const poly = new t.PolySynth(t.Synth, {
        oscillator: { type: id === "synthbright" ? "fatsawtooth" : "fatsquare" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.4 },
      });
      poly.connect(reverb);
      poly.volume.value = id === "synthbright" ? -18 : -16;
      return {
        node: poly,
        playBar: (notes, time, bar) =>
          poly.triggerAttackRelease(notes, bar * 0.98, time),
      };
    }
    default: {
      const poly = new t.PolySynth(t.Synth).toDestination();
      poly.volume.value = -10;
      return {
        node: poly,
        playBar: (notes, time, bar) =>
          poly.triggerAttackRelease(notes, bar * 0.95, time),
      };
    }
  }
}

async function ensureTone() {
  if (!Tone) Tone = await import("tone");
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
  if (!crash) {
    const hpf = new Tone.Filter(4000, "highpass").toDestination();
    crash = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 1.2, sustain: 0 },
    });
    crash.connect(hpf);
    crash.volume.value = -10;
  }
  return Tone;
}

/** クラッシュシンバルを即時に鳴らす(盛り上げ用) */
export async function hitCrash(): Promise<void> {
  const t = await ensureTone();
  crash!.triggerAttackRelease("2n", t.now());
}

function getVoice(t: typeof ToneType, id: InstrumentId): Voice {
  if (!voices[id]) voices[id] = makeVoice(t, id);
  return voices[id]!;
}

/** 楽器(サンプル含む)を事前に読み込む。読み込み完了を待つ。 */
export async function prepareInstrument(id: InstrumentId): Promise<void> {
  const t = await ensureTone();
  const voice = getVoice(t, id);
  if (voice.ready) await voice.ready;
}

export type PlayHandlers = {
  onStep?: (index: number) => void;
  onEnd?: () => void;
  /** 拍ごと。globalBeat=通算拍, beatInBar=小節内0..3 */
  onBeat?: (globalBeat: number, beatInBar: number) => void;
};

export type PlayOptions = {
  drums?: boolean;
  instrument?: InstrumentId;
  /** ループ再生(ジャム用) */
  loop?: boolean;
  /** 開始前のカウントイン拍数(0=なし) */
  countIn?: number;
  /** グルーヴ強度 0=静か 1=普通 2=熱い */
  groove?: number;
};

type DrumHit = { pos: number; fn: (time: number) => void };

/** グルーヴ別ドラムの「1拍ぶんの打点リスト」(pos=拍内の位置0..1)。
 * 各打点を個別に Transport へ載せることでテンポ変更に追従し、
 * モノフォニックなドラム音源でも時刻が逆行しない。 */
function drumHits(groove: number, inBar: number): DrumHit[] {
  const K: DrumHit["fn"] = (time) => kick!.triggerAttackRelease("C1", "8n", time);
  const S: DrumHit["fn"] = (time) => snare!.triggerAttackRelease("16n", time);
  const H: DrumHit["fn"] = (time) => hihat!.triggerAttackRelease("32n", time);
  const Hq: DrumHit["fn"] = (time) => hihat!.triggerAttackRelease("64n", time);
  const hits: DrumHit[] = [];
  if (groove === 0) {
    if (inBar === 0) hits.push({ pos: 0, fn: K });
    hits.push({ pos: 0, fn: H });
    return hits;
  }
  if (inBar === 0 || inBar === 2) hits.push({ pos: 0, fn: K });
  if (inBar === 1 || inBar === 3) hits.push({ pos: 0, fn: S });
  if (groove >= 2) {
    for (let s = 0; s < 4; s++) hits.push({ pos: s * 0.25, fn: Hq });
    if (inBar === 2) hits.push({ pos: 0.5, fn: K });
  } else {
    hits.push({ pos: 0, fn: H });
    hits.push({ pos: 0.5, fn: H });
  }
  return hits;
}

export async function playSong(
  steps: SongStep[],
  bpm: number,
  handlers: PlayHandlers = {},
  options: PlayOptions = {},
): Promise<void> {
  if (steps.length === 0) return;
  const t = await ensureTone();
  stopProgression();

  const voice = getVoice(t, options.instrument ?? "piano");
  if (voice.ready) await voice.ready;

  t.Transport.bpm.value = bpm;
  const beatSeconds = 60 / bpm; // コードの長さ算出用(おおよそ)
  const PPQ = t.Transport.PPQ;
  const ci = options.countIn ?? 0;
  // 拍位置(カウントイン込み) -> Transport の tick 時刻(テンポ追従)
  const tk = (beatPos: number) => `${Math.round((ci + beatPos) * PPQ)}i`;
  isPlaying = true;

  // コード(可変長)
  let acc = 0;
  steps.forEach((step, i) => {
    const dur = step.beats * beatSeconds;
    t.Transport.schedule((time) => {
      if (step.notes.length > 0) voice.playBar(step.notes, time, dur, beatSeconds);
      t.Draw.schedule(() => handlers.onStep?.(i), time);
    }, tk(acc));
    acc += step.beats;
  });
  const totalBeats = acc;

  // カウントイン
  for (let b = 0; b < ci; b++) {
    t.Transport.schedule((time) => {
      hihat!.triggerAttackRelease("16n", time);
      if (b === 0) kick!.triggerAttackRelease("C1", "8n", time);
    }, `${Math.round(b * PPQ)}i`);
  }

  // 拍コールバック ＋ ドラム(各打点を個別スケジュール=テンポ追従)
  const groove = options.groove ?? 1;
  for (let beat = 0; beat < totalBeats; beat++) {
    const inBar = beat % 4;
    t.Transport.schedule((time) => {
      t.Draw.schedule(() => handlers.onBeat?.(beat, inBar), time);
    }, tk(beat));
    if (options.drums !== false) {
      for (const h of drumHits(groove, inBar)) {
        t.Transport.schedule((time) => h.fn(time), tk(beat + h.pos));
      }
    }
  }

  if (options.loop) {
    t.Transport.loop = true;
    t.Transport.loopStart = `${Math.round(ci * PPQ)}i`;
    t.Transport.loopEnd = `${Math.round((ci + totalBeats) * PPQ)}i`;
  } else {
    t.Transport.loop = false;
    t.Transport.schedule((time) => {
      t.Draw.schedule(() => {
        isPlaying = false;
        handlers.onEnd?.();
      }, time);
    }, tk(totalBeats));
  }

  t.Transport.start();
}

export function stopProgression(): void {
  if (!Tone) return;
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  Tone.Transport.position = 0;
  Tone.Transport.loop = false;
  // 描画タイムラインもクリア(再開時に過去時刻を入れて例外になるのを防ぐ)
  Tone.Draw.cancel(0);
  Object.values(voices).forEach((v) => v?.node.releaseAll?.());
  isPlaying = false;
}

export function getIsPlaying(): boolean {
  return isPlaying;
}

/** 再生中にテンポを生で変更する */
export function setBpm(bpm: number): void {
  if (Tone) Tone.Transport.bpm.value = bpm;
}

/** 選べる楽器 */
export const INSTRUMENTS: { id: InstrumentId; label: string; emoji: string }[] = [
  { id: "piano", label: "ピアノ", emoji: "🎹" },
  { id: "aguitar", label: "アコギ", emoji: "🎸" },
  { id: "eguitar", label: "エレキ", emoji: "🎸" },
  { id: "epiano", label: "エレピ", emoji: "🎶" },
  { id: "synth", label: "シンセ", emoji: "🎛️" },
  { id: "synthbright", label: "ブライト", emoji: "✨" },
];
