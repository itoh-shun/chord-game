// コード進行アイデアの生成・提案(音楽理論ベース)

import type { ChordCell, Quality } from "@/types";
import { DIATONIC_QUALITY } from "@/lib/music";
import { makeCell } from "@/lib/song";

export type IdeaMood = "明るい" | "切ない" | "エモい" | "おしゃれ" | "激しい";
export const IDEA_MOODS: IdeaMood[] = ["明るい", "切ない", "エモい", "おしゃれ", "激しい"];

// メジャーキーの機能和声的な「次に来やすい度数」(重み付き)
const NEXT: Record<number, number[]> = {
  1: [4, 5, 6, 2, 3, 4, 5],
  2: [5, 7, 5, 1],
  3: [6, 4, 2, 6],
  4: [5, 1, 2, 6, 5],
  5: [1, 6, 4, 1, 3],
  6: [4, 2, 5, 1, 4],
  7: [1, 3, 1],
};

function pickW<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** ムードごとの開始/終止/質感 */
function moodConfig(mood: IdeaMood) {
  switch (mood) {
    case "切ない":
      return { start: 6, end: 6, jazzy: false, minorBias: true };
    case "エモい":
      return { start: 4, end: 6, jazzy: false, minorBias: true };
    case "おしゃれ":
      return { start: 1, end: 1, jazzy: true, minorBias: false };
    case "激しい":
      return { start: 5, end: 1, jazzy: false, minorBias: false };
    default:
      return { start: 1, end: 1, jazzy: false, minorBias: false };
  }
}

/** 度数 -> コードの種類(おしゃれ時は7th系に) */
function qualityFor(degree: number, jazzy: boolean): Quality {
  const base = DIATONIC_QUALITY[degree - 1] ?? "";
  if (!jazzy) return base;
  // おしゃれ: 7th系へ
  if (degree === 1 || degree === 4) return "maj7";
  if (degree === 5) return "7";
  if (degree === 7) return "m7";
  return base === "m" ? "m7" : "maj7";
}

/** 進行アイデアを生成する */
export function generateProgression(mood: IdeaMood, length = 4): ChordCell[] {
  const cfg = moodConfig(mood);
  const degrees: number[] = [cfg.start];
  for (let i = 1; i < length; i++) {
    const prev = degrees[i - 1];
    let next = pickW(NEXT[prev] ?? [1, 4, 5, 6]);
    // 直前と同じは避ける
    if (next === prev) next = pickW(NEXT[prev] ?? [4, 5]);
    degrees.push(next);
  }
  // 終止を整える
  degrees[length - 1] = cfg.end;
  return degrees.map((d) => makeCell(d, qualityFor(d, cfg.jazzy), 4));
}

/** 次に来やすいコード候補(度数+種類)を返す */
export function nextSuggestions(
  degree: number,
  jazzy = false,
): { degree: number; quality: Quality }[] {
  const cand = [...new Set(NEXT[degree] ?? [1, 4, 5, 6])].slice(0, 4);
  return cand.map((d) => ({ degree: d, quality: qualityFor(d, jazzy) }));
}

/** 代理コード(ダイアトニック代理) */
export function substitute(cell: ChordCell): ChordCell {
  const map: Record<number, number> = { 1: 6, 6: 1, 4: 2, 2: 4, 5: 3, 3: 5, 7: 5 };
  const d = map[cell.degree] ?? cell.degree;
  return { ...cell, degree: d, quality: DIATONIC_QUALITY[d - 1] ?? "" };
}

/** おしゃれ化(7th/テンションを足す) */
export function jazzify(cell: ChordCell): ChordCell {
  return { ...cell, quality: qualityFor(cell.degree, true) };
}
