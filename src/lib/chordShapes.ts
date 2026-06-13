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

// 表示用ルート(シャープ) -> chords-db のキー(オブジェクトキー名)
const ROOT_TO_KEY: Record<string, string> = {
  C: "C",
  "C#": "Csharp",
  D: "D",
  "D#": "Eb",
  E: "E",
  F: "F",
  "F#": "Fsharp",
  G: "G",
  "G#": "Ab",
  A: "A",
  "A#": "Bb",
  B: "B",
};

// サフィックスが無い場合の代替候補(順に探す)
const SUFFIX_FALLBACK: Record<string, string[]> = {
  major: [],
  minor: [],
  dim: ["minor"],
  dim7: ["dim", "minor"],
  aug: ["major"],
  sus4: ["major"],
  sus2: ["sus4", "major"],
  "7": ["major"],
  maj7: ["major"],
  m7: ["minor"],
  m7b5: ["dim", "minor"],
  "6": ["major"],
  add9: ["major"],
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
  // 完全一致 -> 代替候補 -> major/minor の順に探す
  const candidates = [
    dbSuffix,
    ...(SUFFIX_FALLBACK[dbSuffix] ?? []),
    suffixRaw.startsWith("m") ? "minor" : "major",
  ];
  let found: DbChord | undefined;
  for (const s of candidates) {
    found = chords[key].find((c) => c.suffix === s && c.positions?.length);
    if (found) break;
  }
  if (!found || !found.positions.length) return null;

  const p = found.positions[0];
  return { frets: p.frets, baseFret: p.baseFret, barres: p.barres ?? [] };
}
