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
  mode: "play",
  instrument: "piano",
  drums: true,
  countIn: true,
  isPlaying: false,
  audioLoading: false,
  current: -1,
  editing: null,

  brief: null,
  result: null,
  coins: 0,
  clears: 0,
  unlocked: BASE_UNLOCKED,
  justUnlocked: [],

  hydrate: () => {
    const p = loadProgress();
    set(p);
    if (!get().brief) get().startChallenge();
  },
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
  },
  setKey: (k) => set((s) => ({ song: { ...s.song, key: k } })),
  transposeBy: (semi) =>
    set((s) => ({ song: { ...s.song, key: transposeKey(s.song.key, semi) } })),
  setTempo: (t) =>
    set((s) => ({ song: { ...s.song, tempo: Math.max(40, Math.min(220, t)) } })),
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
    const { song, instrument, drums, countIn, mode } = get();
    const events = songToEvents(song);
    if (!events.length) return;
    set({ audioLoading: true });
    try {
      await prepareInstrument(instrument);
    } finally {
      set({ audioLoading: false });
    }
    set({ isPlaying: true, current: -1 });
    await playSong(
      events.map((e) => ({ notes: e.notes, beats: e.beats })),
      song.tempo,
      {
        onStep: (i) => set({ current: i }),
        onEnd: () => set({ isPlaying: false, current: -1 }),
      },
      {
        drums,
        instrument,
        loop: mode === "jam",
        countIn: mode === "jam" && countIn ? 4 : 0,
      },
    );
  },
  stop: () => {
    stopProgression();
    set({ isPlaying: false, current: -1 });
  },
  exportMidi: () => downloadMidi(get().song),
  newSong: () => {
    get().stop();
    set({ song: defaultSong(), editing: null });
  },
}));

/** 再生イベント列(セレクタ用) */
export { songToEvents };
