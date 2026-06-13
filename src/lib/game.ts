// ゲームセッション生成ロジック

import customersData from "@/data/customers.json";
import themesData from "@/data/themes.json";
import chordsData from "@/data/chords.json";
import specialsData from "@/data/specials.json";
import type {
  ChordCard,
  CustomerCard,
  DrawnThemes,
  Section,
  SpecialCard,
  ThemeCard,
  BoardSlot,
} from "@/types";
import { pickOne, shuffle, genId } from "@/lib/random";
import { AVAILABLE_KEYS } from "@/lib/music";

export const customers = customersData as CustomerCard[];
export const themes = themesData as ThemeCard[];
export const chords = chordsData as ChordCard[];
export const specials = specialsData as SpecialCard[];

/** 曲構成テンプレート (S=サビ) */
const STRUCTURE_TEMPLATES: Section[][] = [
  ["A", "A", "B", "S", "A", "B", "S", "C", "S"],
  ["A", "B", "S", "A", "B", "S", "C", "S"],
  ["A", "A", "B", "S", "B", "S", "C", "S"],
  ["A", "B", "S", "A", "B", "S", "S"],
  ["A", "A", "B", "S", "A", "A", "B", "S", "C", "S"],
];

export type GameSession = {
  customer: CustomerCard;
  themes: DrawnThemes;
  board: BoardSlot[];
  /** 配られた全コードカード(id -> カード) */
  dealtCards: Record<string, ChordCard>;
  special: SpecialCard;
  /** 基準キー */
  key: string;
  /** 転調の半音数(0=なし)。最後のサビ以降に適用 */
  modulationSemitones: number;
};

function drawThemes(): DrawnThemes {
  const byCat = (cat: ThemeCard["category"]) =>
    pickOne(themes.filter((t) => t.category === cat));
  return {
    genre: byCat("genre"),
    tempo: byCat("tempo"),
    mood: byCat("mood"),
    situation: byCat("situation"),
  };
}

/** 構成に必要なセクション数を数え、各セクションのカードを余裕をもって配る */
function dealHand(structure: Section[]): Record<string, ChordCard> {
  const counts: Record<Section, number> = { A: 0, B: 0, S: 0, C: 0 };
  for (const s of structure) counts[s]++;

  const dealt: Record<string, ChordCard> = {};
  (Object.keys(counts) as Section[]).forEach((section) => {
    if (counts[section] === 0) return;
    const pool = shuffle(chords.filter((c) => c.section === section));
    // 必要数 + 予備2枚 (プールが足りなければある分だけ)
    const need = Math.min(counts[section] + 2, pool.length);
    pool.slice(0, need).forEach((card) => {
      dealt[card.id] = card;
    });
  });
  return dealt;
}

/** 店長カードを構成・キーに適用する */
function applySpecial(
  special: SpecialCard,
  structure: Section[],
): { structure: Section[]; modulationSemitones: number } {
  const newStructure = [...structure];
  let modulationSemitones = 0;

  switch (special.id) {
    case "sp_add2bars": {
      // サビ前にCメロ(展開)枠を1つ挿入する代わりに、最初のサビ前に休止枠は持たないため
      // 構成上は何もしないが、最初のSの直前にBを追加して「タメ」を表現
      const idx = newStructure.indexOf("S");
      if (idx > 0) newStructure.splice(idx, 0, "B");
      break;
    }
    case "sp_cut4bars": {
      // 末尾以外の1枠を削る
      if (newStructure.length > 4) newStructure.splice(1, 1);
      break;
    }
    case "sp_add_c":
      // 最後のサビ前にCメロを追加
      {
        const lastS = newStructure.lastIndexOf("S");
        if (lastS >= 0) newStructure.splice(lastS, 0, "C");
        else newStructure.push("C");
      }
      break;
    case "sp_add_chorus":
      newStructure.push("S");
      break;
    case "sp_half_up":
      modulationSemitones = 1;
      break;
    case "sp_whole_up":
      modulationSemitones = 2;
      break;
    case "sp_relative":
      // 平行調(短調側)へ。playback上は便宜的に -3 半音シフト
      modulationSemitones = -3;
      break;
    default:
      // constraint / genre 系は構成・キー変更なし(創作指示のみ)
      break;
  }
  return { structure: newStructure, modulationSemitones };
}

/** 新しいゲームセッションを生成する */
export function createSession(): GameSession {
  const customer = pickOne(customers);
  const drawn = drawThemes();
  const key = pickOne(AVAILABLE_KEYS);
  const special = pickOne(specials);

  const baseStructure = pickOne(STRUCTURE_TEMPLATES);
  const { structure, modulationSemitones } = applySpecial(
    special,
    baseStructure,
  );

  const board: BoardSlot[] = structure.map((section) => ({
    id: genId("slot"),
    section,
    cardId: null,
  }));

  const dealtCards = dealHand(structure);

  return {
    customer,
    themes: drawn,
    board,
    dealtCards,
    special,
    key,
    modulationSemitones,
  };
}
