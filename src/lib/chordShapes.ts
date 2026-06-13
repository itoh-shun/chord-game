// コード名 -> ギター運指(コードダイアグラム)データ

import guitar from "@tombatossals/chords-db/lib/guitar.json";

export type ChordShape = {
  /** 6弦(低)→1弦(高)の押弦フレット。0=開放, -1=ミュート, baseFret基準の相対値 */
  frets: number[];
  baseFret: number;
  /** バレーするフレット(相対値)の配列 */
  barres: number[];
};

type Position = {
  frets: number[];
  baseFret: number;
  barres: number[];
};
type DbChord = { suffix: string; positions: Position[] };
const chords = (guitar as { chords: Record<string, DbChord[]> }).chords;

// 表示用ルート(シャープ) -> chords-db のキー
const ROOT_TO_KEY: Record<string, string> = {
  C: "C",
  "C#": "C#",
  D: "D",
  "D#": "Eb",
  E: "E",
  F: "F",
  "F#": "F#",
  G: "G",
  "G#": "Ab",
  A: "A",
  "A#": "Bb",
  B: "B",
};

// コード名サフィックス -> chords-db のサフィックス
const SUFFIX_TO_DB: Record<string, string> = {
  "": "major",
  m: "minor",
  dim: "dim",
  dim7: "dim7",
  aug: "aug",
  sus4: "sus4",
  sus2: "sus2",
  "7": "7",
  maj7: "maj7",
  m7: "m7",
  "m7♭5": "m7b5",
  "6": "6",
  add9: "add9",
};

/**
 * "Am" "G7" "F#m7" "C/E" などのコード名から運指を返す。
 * オンコード(/X)はベースを無視。見つからなければ null。
 */
export function getChordShape(chordName: string): ChordShape | null {
  const base = chordName.split("/")[0];
  const m = base.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return null;
  const root = m[1];
  const suffixRaw = m[2];

  const key = ROOT_TO_KEY[root];
  if (!key || !chords[key]) return null;

  const dbSuffix = SUFFIX_TO_DB[suffixRaw] ?? "major";
  const found =
    chords[key].find((c) => c.suffix === dbSuffix) ??
    chords[key].find((c) => c.suffix === (suffixRaw.startsWith("m") ? "minor" : "major"));
  if (!found || !found.positions.length) return null;

  const p = found.positions[0];
  return { frets: p.frets, baseFret: p.baseFret, barres: p.barres ?? [] };
}
