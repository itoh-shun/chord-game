// BLOOM — スケール(必ず心地よい音程)とムードのパレット

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function midiToName(midi: number): string {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}

export type Mood = {
  id: string;
  name: string;
  /** ルートのピッチクラス */
  root: number;
  /** スケール(半音度) */
  scale: number[];
  /** 背景の基準色相 */
  bgHue: number;
  /** 粒の色相レンジ [from,to] */
  hue: [number, number];
};

export const MOODS: Mood[] = [
  { id: "night", name: "夜", root: 9, scale: [0, 3, 5, 7, 10], bgHue: 230, hue: [200, 280] },
  { id: "day", name: "陽", root: 0, scale: [0, 2, 4, 7, 9], bgHue: 35, hue: [20, 60] },
  { id: "dream", name: "夢", root: 2, scale: [0, 2, 5, 7, 9], bgHue: 300, hue: [280, 340] },
  { id: "zen", name: "和", root: 4, scale: [0, 1, 5, 7, 8], bgHue: 10, hue: [0, 45] },
];

/** ムードの音名リスト(低→高, オクターブ3..6) */
export function buildNotes(mood: Mood): string[] {
  const out: string[] = [];
  for (let oct = 3; oct <= 6; oct++) {
    for (const deg of mood.scale) {
      out.push(midiToName(12 * (oct + 1) + mood.root + deg));
    }
  }
  return out;
}
