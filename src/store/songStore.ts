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
  type InstrumentId,
} from "@/lib/audio";
import { downloadMidi } from "@/lib/midi";

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
  mode: "compose",
  instrument: "piano",
  drums: true,
  countIn: true,
  isPlaying: false,
  audioLoading: false,
  current: -1,
  editing: null,

  setMode: (mode) => {
    get().stop();
    set({ mode });
  },
  setKey: (k) => set((s) => ({ song: { ...s.song, key: k } })),
  transposeBy: (semi) =>
    set((s) => ({ song: { ...s.song, key: transposeKey(s.song.key, semi) } })),
  setTempo: (t) =>
    set((s) => ({ song: { ...s.song, tempo: Math.max(40, Math.min(220, t)) } })),
  setInstrument: (instrument) => set({ instrument }),
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
