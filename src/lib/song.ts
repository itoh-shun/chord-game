// 曲モデルのヘルパ: 既定曲・プリセット進行・再生イベント化

import type { ChordCell, Quality, Section, Song } from "@/types";
import { genId } from "@/lib/random";
import { cellChordName, cellNotes, cellToRoman } from "@/lib/music";

/** セクションの色パレット(順番に割り当て) */
export const SECTION_COLORS = [
  "sky",
  "violet",
  "rose",
  "emerald",
  "amber",
  "cyan",
];

export function makeCell(
  degree: number,
  quality: Quality = "",
  beats = 4,
  accidental = 0,
): ChordCell {
  return { id: genId("c"), degree, quality, beats, accidental };
}

function makeSection(name: string, color: string, chords: ChordCell[]): Section {
  return { id: genId("sec"), name, color, chords };
}

/** 起動時のサンプル曲 */
export function defaultSong(): Song {
  return {
    key: "C",
    tempo: 120,
    sections: [
      makeSection("Aメロ", "sky", [
        makeCell(1),
        makeCell(5),
        makeCell(6, "m"),
        makeCell(4),
      ]),
      makeSection("サビ", "rose", [
        makeCell(4),
        makeCell(5),
        makeCell(3, "m"),
        makeCell(6, "m"),
      ]),
    ],
  };
}

/** 定番コード進行プリセット(セクションに流し込む) */
export const PROGRESSION_PRESETS: {
  name: string;
  hint: string;
  chords: [number, Quality][];
}[] = [
  { name: "王道進行", hint: "IV-V-iii-vi", chords: [[4, ""], [5, ""], [3, "m"], [6, "m"]] },
  { name: "ポップ定番", hint: "I-V-vi-IV", chords: [[1, ""], [5, ""], [6, "m"], [4, ""]] },
  { name: "小室進行", hint: "vi-IV-V-I", chords: [[6, "m"], [4, ""], [5, ""], [1, ""]] },
  {
    name: "カノン進行",
    hint: "I-V-vi-iii-IV",
    chords: [[1, ""], [5, ""], [6, "m"], [3, "m"], [4, ""], [1, ""], [4, ""], [5, ""]],
  },
  { name: "丸サ進行風", hint: "IVM7-III7-vim7-IIm7", chords: [[4, "maj7"], [3, "7"], [6, "m7"], [2, "m7"]] },
  { name: "切ないマイナー", hint: "vi-V-IV-V", chords: [[6, "m"], [5, ""], [4, ""], [5, ""]] },
];

export function presetToChords(p: (typeof PROGRESSION_PRESETS)[number]): ChordCell[] {
  return p.chords.map(([d, q]) => makeCell(d, q));
}

/** 新規セクションのテンプレ名 */
export const SECTION_NAMES = ["Aメロ", "Bメロ", "サビ", "Cメロ", "イントロ", "間奏", "大サビ", "アウトロ"];

export type SongEvent = {
  cellId: string;
  sectionId: string;
  notes: string[];
  name: string;
  roman: string;
  beats: number;
};

/** 曲を再生イベント列に変換(キーで音名を解決) */
export function songToEvents(song: Song): SongEvent[] {
  const events: SongEvent[] = [];
  for (const sec of song.sections) {
    for (const c of sec.chords) {
      events.push({
        cellId: c.id,
        sectionId: sec.id,
        notes: cellNotes(c, song.key),
        name: cellChordName(c, song.key),
        roman: cellToRoman(c),
        beats: c.beats,
      });
    }
  }
  return events;
}

/** 全コード数 */
export function chordCount(song: Song): number {
  return song.sections.reduce((n, s) => n + s.chords.length, 0);
}
