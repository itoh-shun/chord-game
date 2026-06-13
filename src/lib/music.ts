// 音楽理論ユーティリティ: ローマ数字 -> コード -> 音名

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

/** キー名 -> 主音のピッチクラス(0-11) */
export const KEY_PITCH: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

/** メジャースケール各度の主音からの半音数 (I..VII) */
const MAJOR_SCALE_DEGREES: Record<number, number> = {
  1: 0,
  2: 2,
  3: 4,
  4: 5,
  5: 7,
  6: 9,
  7: 11,
};

const ROMAN_TO_NUMBER: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
};

/** コード品質ごとの音程(半音) */
const QUALITY_INTERVALS: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  "6": [0, 4, 7, 9],
  add9: [0, 4, 7, 14],
};

export type ParsedRoman = {
  /** 主音からの半音オフセット */
  semitoneFromTonic: number;
  quality: string;
  /** オンコード(分数コード)のベース音オフセット。なければnull */
  bassSemitone: number | null;
};

/**
 * ローマ数字コード表記を解析する。
 * 例: "I", "vi", "V7", "IVmaj7", "iisus4", "bVII", "IV/V", "V7/vi"
 */
export function parseRoman(input: string): ParsedRoman | null {
  let token = input.trim();
  if (!token) return null;

  // オンコード (分数表記) のベースを分離
  let bassToken: string | null = null;
  if (token.includes("/")) {
    const [chordPart, bass] = token.split("/");
    token = chordPart;
    bassToken = bass;
  }

  const accidentalMatch = token.match(/^([b#]*)/);
  let accidental = 0;
  if (accidentalMatch) {
    for (const ch of accidentalMatch[1]) {
      accidental += ch === "#" ? 1 : -1;
    }
    token = token.slice(accidentalMatch[1].length);
  }

  const numeralMatch = token.match(/^(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)/);
  if (!numeralMatch) return null;
  const numeralRaw = numeralMatch[1];
  const isLower = numeralRaw === numeralRaw.toLowerCase();
  const degree = ROMAN_TO_NUMBER[numeralRaw.toUpperCase()];
  const rest = token.slice(numeralRaw.length);

  let quality = isLower ? "minor" : "major";
  const r = rest.toLowerCase();
  if (r.startsWith("maj7")) quality = "maj7";
  else if (r.startsWith("m7b5") || r.startsWith("ø")) quality = "m7b5";
  else if (r.startsWith("dim7") || r.startsWith("°7")) quality = "dim7";
  else if (r.startsWith("dim") || r.startsWith("°")) quality = "dim";
  else if (r.startsWith("aug") || r.startsWith("+")) quality = "aug";
  else if (r.startsWith("sus4")) quality = "sus4";
  else if (r.startsWith("sus2")) quality = "sus2";
  else if (r.startsWith("sus")) quality = "sus4";
  else if (r.startsWith("add9")) quality = "add9";
  else if (r.startsWith("maj")) quality = "maj7";
  else if (r.startsWith("m7")) quality = "m7";
  else if (r.startsWith("7")) quality = isLower ? "m7" : "7";
  else if (r.startsWith("6")) quality = "6";

  const semitoneFromTonic = MAJOR_SCALE_DEGREES[degree] + accidental;

  let bassSemitone: number | null = null;
  if (bassToken) {
    const parsedBass = parseRoman(bassToken);
    if (parsedBass) bassSemitone = parsedBass.semitoneFromTonic;
  }

  return { semitoneFromTonic, quality, bassSemitone };
}

function pitchClassToName(pc: number): string {
  return NOTE_NAMES[((pc % 12) + 12) % 12];
}

/** ピッチクラス + オクターブ -> "C4" 形式の音名 */
function midiToNoteName(pitch: number): string {
  const pc = ((pitch % 12) + 12) % 12;
  const octave = Math.floor(pitch / 12) - 1;
  return `${NOTE_NAMES[pc]}${octave}`;
}

/**
 * 指定キーでローマ数字コードの和音構成音(Tone.js用音名配列)を返す。
 * @param roman ローマ数字表記
 * @param keyName "C" など
 * @param baseOctave ルートのおおよそのオクターブ (デフォルト4)
 */
export function romanToNotes(
  roman: string,
  keyName: string,
  baseOctave = 4,
): string[] {
  const parsed = parseRoman(roman);
  if (!parsed) return [];
  const keyPc = KEY_PITCH[keyName] ?? 0;
  const rootMidi = (baseOctave + 1) * 12 + keyPc + parsed.semitoneFromTonic;
  const intervals = QUALITY_INTERVALS[parsed.quality] ?? QUALITY_INTERVALS.major;
  const notes = intervals.map((iv) => midiToNoteName(rootMidi + iv));

  if (parsed.bassSemitone !== null) {
    const bassMidi =
      baseOctave * 12 + keyPc + parsed.bassSemitone; // 1オクターブ下のベース
    notes.unshift(midiToNoteName(bassMidi));
  }
  return notes;
}

/**
 * 指定キーでローマ数字コードの表示名(例: "Cmaj7", "Am", "G7")を返す。
 */
export function romanToChordName(roman: string, keyName: string): string {
  const parsed = parseRoman(roman);
  if (!parsed) return roman;
  const keyPc = KEY_PITCH[keyName] ?? 0;
  const rootPc = keyPc + parsed.semitoneFromTonic;
  const rootName = pitchClassToName(rootPc);

  const suffixMap: Record<string, string> = {
    major: "",
    minor: "m",
    dim: "dim",
    aug: "aug",
    sus4: "sus4",
    sus2: "sus2",
    "7": "7",
    maj7: "maj7",
    m7: "m7",
    dim7: "dim7",
    m7b5: "m7♭5",
    "6": "6",
    add9: "add9",
  };
  let name = `${rootName}${suffixMap[parsed.quality] ?? ""}`;

  if (parsed.bassSemitone !== null) {
    const bassName = pitchClassToName(keyPc + parsed.bassSemitone);
    name += `/${bassName}`;
  }
  return name;
}

/** 全音/半音/平行調などの転調後キーを返す */
export function transposeKey(keyName: string, semitones: number): string {
  const pc = KEY_PITCH[keyName] ?? 0;
  return pitchClassToName(pc + semitones);
}

export const AVAILABLE_KEYS = ["C", "D", "E", "F", "G", "A", "B"] as const;

/** 12キー(ジャムの転調用) */
export const CHROMATIC_KEYS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

/** "C4" などの音名を MIDI ノート番号(C4=60)に変換する */
export function noteNameToMidi(name: string): number {
  const m = name.match(/^([A-G]#?)(-?\d+)$/);
  if (!m) return 60;
  const pc = NOTE_NAMES.indexOf(m[1] as (typeof NOTE_NAMES)[number]);
  const octave = parseInt(m[2], 10);
  return (octave + 1) * 12 + (pc < 0 ? 0 : pc);
}

// ===== コードセル(度数+種類) ヘルパ =====

import type { ChordCell, Quality } from "@/types";

/** 選べるコードの種類 */
export const QUALITIES: { id: Quality; label: string }[] = [
  { id: "", label: "メジャー" },
  { id: "m", label: "マイナー" },
  { id: "7", label: "7th" },
  { id: "maj7", label: "maj7" },
  { id: "m7", label: "m7" },
  { id: "6", label: "6th" },
  { id: "sus4", label: "sus4" },
  { id: "sus2", label: "sus2" },
  { id: "add9", label: "add9" },
  { id: "dim", label: "dim" },
  { id: "aug", label: "aug" },
];

/** ダイアトニックの基本の種類(1..7度) */
export const DIATONIC_QUALITY: Quality[] = ["", "m", "m", "", "", "m", "dim"];

const NUM_UPPER = ["I", "II", "III", "IV", "V", "VI", "VII"];
const NUM_LOWER = ["i", "ii", "iii", "iv", "v", "vi", "vii"];
const Q_SPEC: Record<Quality, { minor: boolean; sfx: string }> = {
  "": { minor: false, sfx: "" },
  m: { minor: true, sfx: "" },
  "7": { minor: false, sfx: "7" },
  maj7: { minor: false, sfx: "maj7" },
  m7: { minor: true, sfx: "7" }, // 小文字 + 7 = m7
  "6": { minor: false, sfx: "6" },
  sus4: { minor: false, sfx: "sus4" },
  sus2: { minor: false, sfx: "sus2" },
  add9: { minor: false, sfx: "add9" },
  dim: { minor: true, sfx: "dim" },
  aug: { minor: false, sfx: "aug" },
};

/** コードセル -> ローマ数字表記 */
export function cellToRoman(cell: ChordCell): string {
  const q = Q_SPEC[cell.quality] ?? Q_SPEC[""];
  const acc =
    cell.accidental > 0
      ? "#".repeat(cell.accidental)
      : cell.accidental < 0
        ? "b".repeat(-cell.accidental)
        : "";
  const idx = Math.min(6, Math.max(0, cell.degree - 1));
  const num = (q.minor ? NUM_LOWER : NUM_UPPER)[idx];
  return `${acc}${num}${q.sfx}`;
}

export function cellChordName(cell: ChordCell, key: string): string {
  return romanToChordName(cellToRoman(cell), key);
}

export function cellNotes(cell: ChordCell, key: string, octave = 4): string[] {
  return romanToNotes(cellToRoman(cell), key, octave);
}

/** キーのメジャースケール構成音(ソロの目安) */
export function scaleNotes(key: string): string[] {
  const keyPc = KEY_PITCH[key] ?? 0;
  return [0, 2, 4, 5, 7, 9, 11].map((iv) => pitchClassToName(keyPc + iv));
}

/**
 * 転調を「今回のキーで」具体的に表す。例: "C → C#" / "C(明るい) → Am(切ない)"
 */
export function describeKeyChange(
  keyName: string,
  semitones: number,
): string | null {
  if (semitones === 0) return null;
  const to = transposeKey(keyName, semitones);
  if (semitones === -3) {
    // 平行調(同主短調側) ＝ 明るい → 切ない
    return `${keyName}（明るい） → ${to}m（切ない）`;
  }
  return `${keyName} → ${to}`;
}
