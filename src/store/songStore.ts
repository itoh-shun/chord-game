// ゲーミングDTM — 曲と再生の状態管理

import { create } from "zustand";
import type { ChordCell, Mode, Quality, Song } from "@/types";
import {
  defaultSong,
  presetToChords,
  songToEvents,
  SECTION_COLORS,
  SECTION_NAMES,
  PROGRESSION_PRESETS,
} from "@/lib/song";
import { genId } from "@/lib/random";
import { transposeKey } from "@/lib/music";
import {
  playSong,
  stopProgression,
  prepareInstrument,
  hitCrash,
  setBpm,
  INSTRUMENTS,
  type InstrumentId,
} from "@/lib/audio";
import { downloadMidi } from "@/lib/midi";
import { generateBrief, scoreSong, type Brief, type Result } from "@/lib/challenge";
import {
  generateProgression,
  substitute,
  jazzify,
  type IdeaMood,
} from "@/lib/ideas";
import { DECK, assembleSong, type SectionKey } from "@/lib/deck";

/** コインで解放される楽器の閾値(累計コイン) */
const UNLOCKS: { id: InstrumentId; coins: number }[] = [
  { id: "eguitar", coins: 60 },
  { id: "epiano", coins: 140 },
  { id: "synth", coins: 240 },
  { id: "synthbright", coins: 360 },
];
const BASE_UNLOCKED: InstrumentId[] = ["piano", "aguitar"];

function loadProgress(): { coins: number; clears: number; unlocked: InstrumentId[] } {
  if (typeof window === "undefined")
    return { coins: 0, clears: 0, unlocked: BASE_UNLOCKED };
  try {
    const raw = localStorage.getItem("cs_progress");
    if (raw) {
      const p = JSON.parse(raw);
      return {
        coins: p.coins ?? 0,
        clears: p.clears ?? 0,
        unlocked: p.unlocked ?? BASE_UNLOCKED,
      };
    }
  } catch {}
  return { coins: 0, clears: 0, unlocked: BASE_UNLOCKED };
}
function saveProgress(p: { coins: number; clears: number; unlocked: InstrumentId[] }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("cs_progress", JSON.stringify(p));
  } catch {}
}

export function instrumentUnlocked(id: InstrumentId, unlocked: InstrumentId[]): boolean {
  return unlocked.includes(id);
}
export { INSTRUMENTS };

/** タップテンポの打点履歴 */
const tapTimes: number[] = [];
/** 再生の世代トークン(再入で古い再生を破棄) */
let playSeq = 0;

type State = {
  song: Song;
  mode: Mode;
  instrument: InstrumentId;
  drums: boolean;
  countIn: boolean;
  isPlaying: boolean;
  audioLoading: boolean;
  /** 再生中のイベント(コード)インデックス。-1=なし */
  current: number;
  /** 編集対象のコード {sectionId, chordId} */
  editing: { sectionId: string; chordId: string } | null;

  // ===== ゲーム(お題チャレンジ) =====
  brief: Brief | null;
  result: Result | null;
  coins: number;
  clears: number;
  unlocked: InstrumentId[];
  /** 直近で解放された楽器(結果画面の演出用) */
  justUnlocked: InstrumentId[];

  hydrate: () => void;
  startChallenge: () => void;
  submitChallenge: () => void;
  closeResult: () => void;
  nextChallenge: () => void;

  setMode: (m: Mode) => void;
  setKey: (k: string) => void;
  transposeBy: (semi: number) => void;
  setTempo: (t: number) => void;
  setInstrument: (i: InstrumentId) => void;
  toggleDrums: () => void;
  toggleCountIn: () => void;

  // ===== セッション(ライブ) =====
  /** グルーヴ強度 0/1/2 */
  groove: number;
  /** ループするセクションid。null=曲全体 */
  jamSection: string | null;
  /** 小節内の拍(0..3)、再生中のパルス用 */
  beat: number;
  /** 現在コードの残り拍 */
  chordBeatsLeft: number;
  /** 盛り上げフラッシュのトリガ(増えるたびに演出) */
  flash: number;
  setGroove: (g: number) => void;
  jumpSection: (sectionId: string | null) => void;
  tapTempo: () => void;
  hype: () => void;

  addSection: () => void;
  removeSection: (sectionId: string) => void;
  renameSection: (sectionId: string, name: string) => void;
  applyPreset: (sectionId: string, presetIndex: number) => void;
  addChord: (sectionId: string) => void;
  updateChord: (
    sectionId: string,
    chordId: string,
    patch: Partial<ChordCell>,
  ) => void;
  removeChord: (sectionId: string, chordId: string) => void;
  setEditing: (e: State["editing"]) => void;

  // ===== つなぐ(カード組み合わせ) =====
  sel: Record<SectionKey, number>;
  cycleCard: (sk: SectionKey, dir: number) => void;
  shuffleCombine: () => void;
  /** 現在の組み合わせを編集用に compose へ送る */
  sendToCompose: () => void;

  // ===== アイデア生成 =====
  ideaMood: IdeaMood;
  setIdeaMood: (m: IdeaMood) => void;
  /** 曲全体を新しいアイデアで作り直す(Aメロ+サビ) */
  generateIdea: () => void;
  /** セクションの進行を作り直す */
  regenerateSection: (sectionId: string) => void;
  /** セクションをアレンジ(代理コード/おしゃれ化) */
  arrangeSection: (sectionId: string, kind: "sub" | "jazz") => void;

  play: () => Promise<void>;
  stop: () => void;
  exportMidi: () => void;
  newSong: () => void;
};

const mapSections = (song: Song, fn: (s: Song["sections"][number]) => Song["sections"][number]) => ({
  ...song,
  sections: song.sections.map(fn),
});

export const useSongStore = create<State>((set, get) => ({
  song: defaultSong(),
  mode: "combine",
  sel: { A: 0, B: 0, S: 0 },
  instrument: "piano",
  drums: true,
  countIn: true,
  isPlaying: false,
  audioLoading: false,
  current: -1,
  editing: null,

  groove: 1,
  jamSection: null,
  beat: -1,
  chordBeatsLeft: 0,
  flash: 0,

  brief: null,
  result: null,
  coins: 0,
  clears: 0,
  unlocked: BASE_UNLOCKED,
  justUnlocked: [],

  hydrate: () => {
    const p = loadProgress();
    set(p);
    // つなぐモードの初期曲を組み立て
    const { sel, song } = get();
    set({ song: assembleSong(sel, song.key, song.tempo) });
  },

  cycleCard: (sk, dir) => {
    const { sel, song } = get();
    const len = DECK[sk].length;
    const next = { ...sel, [sk]: (sel[sk] + dir + len) % len };
    set({ sel: next, song: assembleSong(next, song.key, song.tempo), current: -1 });
  },
  shuffleCombine: () => {
    const { song } = get();
    const next = {
      A: Math.floor(Math.random() * DECK.A.length),
      B: Math.floor(Math.random() * DECK.B.length),
      S: Math.floor(Math.random() * DECK.S.length),
    } as Record<SectionKey, number>;
    get().stop();
    set({ sel: next, song: assembleSong(next, song.key, song.tempo), current: -1 });
  },
  sendToCompose: () => set({ mode: "compose" }),
  startChallenge: () =>
    set({ brief: generateBrief(), result: null, song: defaultSong(), editing: null }),
  submitChallenge: () => {
    const { song, brief, coins, clears, unlocked } = get();
    if (!brief) return;
    const result = scoreSong(song, brief);
    const newCoins = coins + result.coins;
    const justUnlocked = UNLOCKS.filter(
      (u) => !unlocked.includes(u.id) && newCoins >= u.coins,
    ).map((u) => u.id);
    const newUnlocked = [...unlocked, ...justUnlocked];
    const next = { coins: newCoins, clears: clears + 1, unlocked: newUnlocked };
    saveProgress(next);
    set({ result, ...next, justUnlocked });
  },
  closeResult: () => set({ result: null, justUnlocked: [] }),
  nextChallenge: () => {
    get().stop();
    set({
      result: null,
      justUnlocked: [],
      brief: generateBrief(),
      song: defaultSong(),
      editing: null,
    });
  },

  setMode: (mode) => {
    get().stop();
    set({ mode });
    if (mode === "play" && !get().brief) get().startChallenge();
    if (mode === "combine") {
      const { sel, song } = get();
      set({ song: assembleSong(sel, song.key, song.tempo) });
    }
  },
  setKey: (k) => set((s) => ({ song: { ...s.song, key: k } })),
  transposeBy: (semi) =>
    set((s) => ({ song: { ...s.song, key: transposeKey(s.song.key, semi) } })),
  setTempo: (t) => {
    const tempo = Math.max(40, Math.min(220, Math.round(t)));
    set((s) => ({ song: { ...s.song, tempo } }));
    if (get().isPlaying) setBpm(tempo); // 生でテンポ反映
  },
  setInstrument: (instrument) => {
    if (get().unlocked.includes(instrument)) set({ instrument });
  },
  toggleDrums: () => set((s) => ({ drums: !s.drums })),
  toggleCountIn: () => set((s) => ({ countIn: !s.countIn })),

  addSection: () => {
    const { song } = get();
    const name = SECTION_NAMES[song.sections.length % SECTION_NAMES.length];
    const color = SECTION_COLORS[song.sections.length % SECTION_COLORS.length];
    set({
      song: {
        ...song,
        sections: [
          ...song.sections,
          {
            id: genId("sec"),
            name,
            color,
            chords: [
              { id: genId("c"), degree: 1, accidental: 0, quality: "", beats: 4 },
            ],
          },
        ],
      },
    });
  },
  removeSection: (sectionId) =>
    set((s) => ({
      song: {
        ...s.song,
        sections: s.song.sections.filter((x) => x.id !== sectionId),
      },
    })),
  renameSection: (sectionId, name) =>
    set((s) => ({
      song: mapSections(s.song, (sec) =>
        sec.id === sectionId ? { ...sec, name } : sec,
      ),
    })),
  applyPreset: (sectionId, presetIndex) =>
    set((s) => ({
      song: mapSections(s.song, (sec) =>
        sec.id === sectionId
          ? { ...sec, chords: presetToChords(PROGRESSION_PRESETS[presetIndex]) }
          : sec,
      ),
    })),
  addChord: (sectionId) =>
    set((s) => ({
      song: mapSections(s.song, (sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              chords: [
                ...sec.chords,
                { id: genId("c"), degree: 1, accidental: 0, quality: "" as Quality, beats: 4 },
              ],
            }
          : sec,
      ),
    })),
  updateChord: (sectionId, chordId, patch) =>
    set((s) => ({
      song: mapSections(s.song, (sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              chords: sec.chords.map((c) =>
                c.id === chordId ? { ...c, ...patch } : c,
              ),
            }
          : sec,
      ),
    })),
  removeChord: (sectionId, chordId) =>
    set((s) => ({
      song: mapSections(s.song, (sec) =>
        sec.id === sectionId
          ? { ...sec, chords: sec.chords.filter((c) => c.id !== chordId) }
          : sec,
      ),
    })),
  setEditing: (editing) => set({ editing }),

  ideaMood: "明るい",
  setIdeaMood: (ideaMood) => set({ ideaMood }),
  generateIdea: () => {
    const { ideaMood, song } = get();
    set({
      song: {
        ...song,
        sections: [
          {
            id: genId("sec"),
            name: "Aメロ",
            color: SECTION_COLORS[0],
            chords: generateProgression(ideaMood, 4),
          },
          {
            id: genId("sec"),
            name: "サビ",
            color: SECTION_COLORS[2],
            chords: generateProgression(ideaMood, 4),
          },
        ],
      },
      editing: null,
    });
  },
  regenerateSection: (sectionId) =>
    set((s) => ({
      song: mapSections(s.song, (sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              chords: generateProgression(
                s.ideaMood,
                Math.max(2, sec.chords.length),
              ),
            }
          : sec,
      ),
    })),
  arrangeSection: (sectionId, kind) =>
    set((s) => ({
      song: mapSections(s.song, (sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              chords: sec.chords.map((c) =>
                kind === "sub" ? { ...substitute(c), id: c.id, beats: c.beats } : { ...jazzify(c), id: c.id, beats: c.beats },
              ),
            }
          : sec,
      ),
    })),

  play: async () => {
    const { song, instrument, drums, countIn, mode, groove, jamSection } = get();
    // セッションでセクション指定があればその展開だけループ
    const useSong =
      jamSection && (mode === "jam")
        ? { ...song, sections: song.sections.filter((s) => s.id === jamSection) }
        : song;
    const events = songToEvents(useSong);
    if (!events.length) return;
    const mySeq = ++playSeq;
    set({ audioLoading: true });
    try {
      await prepareInstrument(instrument);
    } finally {
      set({ audioLoading: false });
    }
    // 後から呼ばれた再生が優先(再入を破棄)
    if (mySeq !== playSeq) return;
    set({ isPlaying: true, current: -1, beat: -1 });
    await playSong(
      events.map((e) => ({ notes: e.notes, beats: e.beats })),
      song.tempo,
      {
        onStep: (i) =>
          set({ current: i, chordBeatsLeft: events[i]?.beats ?? 0 }),
        onBeat: (_g, inBar) =>
          set((s) => ({ beat: inBar, chordBeatsLeft: Math.max(0, s.chordBeatsLeft - 1) })),
        onEnd: () => set({ isPlaying: false, current: -1, beat: -1 }),
      },
      {
        drums,
        instrument,
        groove,
        loop: mode === "jam",
        countIn: mode === "jam" && countIn ? 4 : 0,
      },
    );
  },
  stop: () => {
    stopProgression();
    set({ isPlaying: false, current: -1, beat: -1 });
  },

  setGroove: (groove) => {
    set({ groove });
    if (get().isPlaying) get().play();
  },
  jumpSection: (sectionId) => {
    const cur = get().jamSection;
    set({ jamSection: cur === sectionId ? null : sectionId });
    if (get().isPlaying) get().play();
  },
  tapTempo: () => {
    const now = performance.now();
    tapTimes.push(now);
    while (tapTimes.length > 5) tapTimes.shift();
    if (tapTimes.length >= 2) {
      const diffs = [];
      for (let i = 1; i < tapTimes.length; i++) diffs.push(tapTimes[i] - tapTimes[i - 1]);
      const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      if (avg > 200 && avg < 2000) {
        const bpm = Math.round(60000 / avg);
        get().setTempo(bpm);
      }
    }
  },
  hype: () => {
    set((s) => ({ flash: s.flash + 1, groove: 2 }));
    hitCrash();
    get().transposeBy(2);
    if (get().isPlaying) get().play();
  },
  exportMidi: () => downloadMidi(get().song),
  newSong: () => {
    get().stop();
    set({ song: defaultSong(), editing: null });
  },
}));

/** 再生イベント列(セレクタ用) */
export { songToEvents };
