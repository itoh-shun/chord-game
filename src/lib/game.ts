// ゲームセッション生成ロジック

import customersData from "@/data/customers.json";
import themesData from "@/data/themes.json";
import chordsData from "@/data/chords.json";
import specialsData from "@/data/specials.json";
import structuresData from "@/data/structures.json";
import type {
  ChordCard,
  CustomerCard,
  DrawnThemes,
  Section,
  SpecialCard,
  ThemeCard,
  BoardSlot,
  StructurePattern,
} from "@/types";
import { pickOne, shuffle, genId } from "@/lib/random";
import { AVAILABLE_KEYS } from "@/lib/music";

export const customers = customersData as CustomerCard[];
export const themes = themesData as ThemeCard[];
export const chords = chordsData as ChordCard[];
export const specials = specialsData as SpecialCard[];
export const structures = structuresData as StructurePattern[];

export type GameSession = {
  customer: CustomerCard;
  themes: DrawnThemes;
  board: BoardSlot[];
  /** 採用した曲構成パターン */
  structure: StructurePattern;
  /** 配られた全コードカード(id -> カード) */
  dealtCards: Record<string, ChordCard>;
  special: SpecialCard;
  /** 基準キー */
  key: string;
  /** 転調の半音数(0=なし)。最後のサビ以降に適用 */
  modulationSemitones: number;
};

/**
 * お題を引く。客の「合う候補(fit)」がある項目はその中から引き、
 * 客と矛盾しないお題にする。
 */
function drawThemes(customer: CustomerCard): DrawnThemes {
  const byCat = (
    cat: ThemeCard["category"],
    fit?: string[],
  ): ThemeCard => {
    const all = themes.filter((t) => t.category === cat);
    if (fit && fit.length) {
      const narrowed = all.filter((t) => fit.includes(t.value));
      if (narrowed.length) return pickOne(narrowed);
    }
    return pickOne(all);
  };
  const fit = customer.fit ?? {};
  return {
    genre: byCat("genre", fit.genre),
    tempo: byCat("tempo", fit.tempo),
    mood: byCat("mood", fit.mood),
    situation: byCat("situation", fit.situation),
  };
}

/** ブロック配列からボードスロットを作る */
function blocksToBoard(blocks: StructurePattern["blocks"]): BoardSlot[] {
  return blocks.map((b) => ({
    id: genId("slot"),
    section: b.section,
    label: b.label,
    bars: b.bars,
    cardId: null,
  }));
}

/** 構成に必要なセクション数を数え、各セクションのカードを余裕をもって配る */
function dealHand(board: BoardSlot[]): Record<string, ChordCard> {
  const counts: Record<Section, number> = { A: 0, B: 0, S: 0, C: 0 };
  for (const slot of board) counts[slot.section]++;

  const dealt: Record<string, ChordCard> = {};
  (Object.keys(counts) as Section[]).forEach((section) => {
    if (counts[section] === 0) return;
    const pool = shuffle(chords.filter((c) => c.section === section));
    // 必要数 + 予備3枚 (手札は使い回せるので少し多めの選択肢を配る)
    const need = Math.min(counts[section] + 3, pool.length);
    pool.slice(0, need).forEach((card) => {
      dealt[card.id] = card;
    });
  });
  return dealt;
}

function slot(
  section: Section,
  label: string,
  bars: number,
): BoardSlot {
  return { id: genId("slot"), section, label, bars, cardId: null };
}

/** 店長カードを構成(スロット列)・キーに適用する */
function applySpecial(
  special: SpecialCard,
  board: BoardSlot[],
): { board: BoardSlot[]; modulationSemitones: number } {
  const next = [...board];
  let modulationSemitones = 0;

  const firstS = next.findIndex((s) => s.section === "S");
  const lastS = next.map((s) => s.section).lastIndexOf("S");

  switch (special.id) {
    case "sp_add2bars":
      // 最初のサビ前に「前サビ」枠(4小節)を挿入してタメを作る
      if (firstS >= 0) next.splice(firstS, 0, slot("B", "前サビ", 4));
      break;
    case "sp_cut4bars": {
      // サビ以外の1ブロックを削る
      const idx = next.findIndex((s) => s.section !== "S");
      if (idx >= 0 && next.length > 3) next.splice(idx, 1);
      break;
    }
    case "sp_add_c":
      // 最後のサビ前にCメロ(4小節)を追加
      if (lastS >= 0) next.splice(lastS, 0, slot("C", "Cメロ", 4));
      else next.push(slot("C", "Cメロ", 4));
      break;
    case "sp_add_chorus":
      // 大サビ(8小節)を末尾に追加
      next.push(slot("S", "大サビ", 8));
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
  return { board: next, modulationSemitones };
}

/** 新しいゲームセッションを生成する */
export function createSession(): GameSession {
  const customer = pickOne(customers);
  const drawn = drawThemes(customer);
  const key = pickOne(AVAILABLE_KEYS);
  const special = pickOne(specials);
  const structure = pickOne(structures);

  const baseBoard = blocksToBoard(structure.blocks);
  const { board, modulationSemitones } = applySpecial(special, baseBoard);

  const dealtCards = dealHand(board);

  return {
    customer,
    themes: drawn,
    board,
    structure,
    dealtCards,
    special,
    key,
    modulationSemitones,
  };
}

/** 構成の要約(サビ小節数・前サビ有無など) */
export function structureSummary(board: BoardSlot[]): {
  chorusBars: number;
  hasPreChorus: boolean;
  totalBars: number;
} {
  const chorusBars = Math.max(
    0,
    ...board.filter((s) => s.label === "サビ").map((s) => s.bars),
    ...board.filter((s) => s.section === "S").map((s) => s.bars),
  );
  const hasPreChorus = board.some((s) => s.label === "前サビ");
  const totalBars = board.reduce((sum, s) => sum + s.bars, 0);
  return { chorusBars, hasPreChorus, totalBars };
}
