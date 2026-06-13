// ゲーミングDTM — 型定義

/** コードの種類 */
export type Quality =
  | "" // メジャー
  | "m"
  | "7"
  | "maj7"
  | "m7"
  | "sus4"
  | "sus2"
  | "6"
  | "add9"
  | "dim"
  | "aug";

/** 1つのコード(タイムライン上のセル) */
export type ChordCell = {
  id: string;
  /** スケール度数 1..7 */
  degree: number;
  /** 半音の変化(借用): -1=♭, 0, +1=♯ */
  accidental: number;
  quality: Quality;
  /** 長さ(拍)。4 = 1小節 */
  beats: number;
};

/** 展開(セクション): Aメロ/サビ など */
export type Section = {
  id: string;
  name: string;
  /** 色テーマ(Tailwind の任意キー) */
  color: string;
  chords: ChordCell[];
};

/** 曲全体 */
export type Song = {
  key: string;
  tempo: number;
  sections: Section[];
};

export type Mode = "combine" | "play" | "compose" | "jam";
