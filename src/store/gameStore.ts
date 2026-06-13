// ゲーム状態管理 (Zustand)

import { create } from "zustand";
import type { GameSession } from "@/lib/game";
import { createSession } from "@/lib/game";
import { pickOne } from "@/lib/random";
import { transposeKey } from "@/lib/music";
import type { BoardSlot, ChordCard, Section } from "@/types";

/** 押さえやすい(開放弦が使える)キー */
const EASY_SHAPE_KEYS = ["C", "G", "D", "A", "E"];

/** 画面フェーズ: パック待機 → 開封演出 → 中身公開 → 作曲ボード */
export type Phase = "pack" | "opening" | "revealed" | "playing";

type GameState = {
  session: GameSession | null;
  phase: Phase;
  /** 再生中にハイライトする小節インデックス(-1=なし) */
  playingStep: number;
  isPlaying: boolean;
  /** ドラムを鳴らすか */
  drums: boolean;
  /** サンプル音源の読み込み中か */
  audioLoading: boolean;
  /** カポの位置(フレット, 0=なし)。表示する押さえコードを簡単にする */
  capo: number;

  setAudioLoading: (v: boolean) => void;
  toggleDrums: () => void;
  setCapo: (n: number) => void;
  /** 押さえやすいキーになるカポ位置を自動で選ぶ */
  autoCapo: () => void;
  setPhase: (phase: Phase) => void;
  /** パックを開封して新しいセッションを生成 */
  openPack: () => void;
  newGame: () => void;
  reset: () => void;
  /** 手札のカードをスロットに配置する */
  placeCard: (cardId: string, slotId: string) => void;
  /** スロットのカードを手札に戻す */
  removeFromSlot: (slotId: string) => void;
  /** 全スロットにセクションが合うカードをランダム配置する */
  autoFill: () => void;
  /** 全スロットを空にする */
  clearBoard: () => void;
  setPlayingStep: (step: number) => void;
  setIsPlaying: (playing: boolean) => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  session: null,
  phase: "pack",
  playingStep: -1,
  isPlaying: false,
  drums: true,
  audioLoading: false,
  capo: 0,

  setAudioLoading: (v) => set({ audioLoading: v }),
  toggleDrums: () => set((s) => ({ drums: !s.drums })),
  setCapo: (n) => set({ capo: Math.max(0, Math.min(7, n)) }),
  autoCapo: () => {
    const { session } = get();
    if (!session) return;
    for (let c = 0; c <= 5; c++) {
      if (EASY_SHAPE_KEYS.includes(transposeKey(session.key, -c))) {
        set({ capo: c });
        return;
      }
    }
    set({ capo: 0 });
  },
  setPhase: (phase) => set({ phase }),
  openPack: () =>
    set({
      session: createSession(),
      phase: "opening",
      playingStep: -1,
      isPlaying: false,
    }),
  newGame: () =>
    set({
      session: createSession(),
      phase: "playing",
      playingStep: -1,
      isPlaying: false,
    }),
  reset: () =>
    set({ session: null, phase: "pack", playingStep: -1, isPlaying: false }),

  placeCard: (cardId, slotId) => {
    const { session } = get();
    if (!session) return;
    const card = session.dealtCards[cardId];
    if (!card) return;

    const board: BoardSlot[] = session.board.map((slot) => {
      // セクションが一致するスロットにのみ置ける。
      // 手札は減らさず、同じカードを複数スロットに置ける(1番・2番で同じ進行など)。
      if (slot.id === slotId) {
        if (slot.section !== card.section) return slot;
        return { ...slot, cardId };
      }
      return slot;
    });
    set({ session: { ...session, board } });
  },

  removeFromSlot: (slotId) => {
    const { session } = get();
    if (!session) return;
    const board = session.board.map((slot) =>
      slot.id === slotId ? { ...slot, cardId: null } : slot,
    );
    set({ session: { ...session, board } });
  },

  autoFill: () => {
    const { session } = get();
    if (!session) return;
    // セクションごとに配られたカードをまとめる
    const bySection: Record<Section, ChordCard[]> = { A: [], B: [], S: [], C: [] };
    Object.values(session.dealtCards).forEach((c) => bySection[c.section].push(c));
    const board = session.board.map((slot) => {
      const pool = bySection[slot.section];
      if (!pool.length) return slot;
      return { ...slot, cardId: pickOne(pool).id };
    });
    set({ session: { ...session, board } });
  },

  clearBoard: () => {
    const { session } = get();
    if (!session) return;
    const board = session.board.map((slot) => ({ ...slot, cardId: null }));
    set({ session: { ...session, board } });
  },

  setPlayingStep: (step) => set({ playingStep: step }),
  setIsPlaying: (playing) =>
    set({ isPlaying: playing, ...(playing ? {} : { playingStep: -1 }) }),
}));

/**
 * 手札 = 配られたコードカード全部。
 * 配置しても減らないので、同じカードを複数スロットに使い回せる。
 */
export function selectHand(session: GameSession | null): ChordCard[] {
  if (!session) return [];
  return Object.values(session.dealtCards);
}

export type { ChordCard };
