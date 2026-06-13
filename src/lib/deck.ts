// セクション・カードデッキ(つなげて作曲): A/B/サビ の進行札を組み合わせる

import type { ChordCell, Section, Song } from "@/types";
import { DIATONIC_QUALITY } from "@/lib/music";
import { makeCell, SECTION_COLORS } from "@/lib/song";
import { jazzify } from "@/lib/ideas";
import { genId } from "@/lib/random";

export type DeckCard = {
  id: string;
  name: string;
  cells: ChordCell[];
};

// 4小節フレーズ(度数)。plain と おしゃれ(7th) の2フレーバーで札を増やす
const BASE: Record<"A" | "B" | "S", number[][]> = {
  A: [
    [1, 5, 6, 4], [1, 6, 4, 5], [6, 4, 1, 5], [1, 3, 4, 5], [1, 4, 1, 5],
    [6, 5, 4, 5], [1, 5, 6, 3], [2, 5, 1, 6], [1, 1, 4, 4], [6, 3, 4, 1],
  ],
  B: [
    [6, 4, 1, 5], [2, 5, 1, 1], [4, 5, 6, 6], [2, 5, 3, 6], [4, 3, 2, 5],
    [6, 5, 4, 3], [4, 5, 3, 6], [2, 3, 4, 5], [6, 2, 5, 5], [4, 1, 2, 5],
  ],
  S: [
    [4, 5, 3, 6], [4, 1, 5, 6], [1, 5, 6, 4], [6, 4, 1, 5], [1, 4, 5, 1],
    [4, 5, 6, 1], [1, 5, 4, 5], [6, 5, 4, 1], [4, 5, 1, 6], [1, 6, 4, 5],
    [5, 6, 4, 1], [1, 4, 6, 5],
  ],
};

const NICK: Record<string, string> = {
  "4 5 3 6": "王道進行",
  "1 5 6 4": "カノン系",
  "6 4 1 5": "エモ定番",
  "1 6 4 5": "50s進行",
  "2 5 1 1": "ツーファイブ",
  "1 4 5 1": "明るく終止",
  "6 5 4 3": "下降クリシェ",
  "1 4 6 5": "ポップ",
};

function cellsFor(seq: number[], jazz: boolean): ChordCell[] {
  return seq.map((d) => {
    const base = makeCell(d, DIATONIC_QUALITY[d - 1] ?? "", 4);
    return jazz ? { ...jazzify(base), id: base.id, beats: 4 } : base;
  });
}

function buildDeck(section: "A" | "B" | "S"): DeckCard[] {
  const cards: DeckCard[] = [];
  BASE[section].forEach((seq, i) => {
    const nick = NICK[seq.join(" ")] ?? "進行";
    cards.push({ id: `${section}-${i}-p`, name: nick, cells: cellsFor(seq, false) });
    cards.push({ id: `${section}-${i}-j`, name: `${nick}・おしゃれ`, cells: cellsFor(seq, true) });
  });
  return cards;
}

/** セクションごとの札デッキ */
export const DECK = {
  A: buildDeck("A"),
  B: buildDeck("B"),
  S: buildDeck("S"),
};

export const SECTION_KEYS = ["A", "B", "S"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export const SECTION_DISPLAY: Record<SectionKey, string> = {
  A: "Aメロ",
  B: "Bメロ",
  S: "サビ",
};
const SECTION_COLOR_BY: Record<SectionKey, string> = {
  A: SECTION_COLORS[0],
  B: SECTION_COLORS[1],
  S: SECTION_COLORS[2],
};

/** 全組み合わせ数 (A × B × サビ) */
export const TOTAL_COMBOS = DECK.A.length * DECK.B.length * DECK.S.length;

/** 選択(各セクションの札index)から曲を組み立てる */
export function assembleSong(
  sel: Record<SectionKey, number>,
  key: string,
  tempo: number,
): Song {
  const sections: Section[] = SECTION_KEYS.map((sk) => {
    const card = DECK[sk][sel[sk]] ?? DECK[sk][0];
    return {
      id: genId("sec"),
      name: SECTION_DISPLAY[sk],
      color: SECTION_COLOR_BY[sk],
      // 札の cells を複製(idを振り直す)
      chords: card.cells.map((c) => ({ ...c, id: genId("c") })),
    };
  });
  return { key, tempo, sections };
}
