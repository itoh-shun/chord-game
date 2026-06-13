// ゲーム状態管理 (Zustand)

import { create } from "zustand";
import type { GameSession } from "@/lib/game";
import { createSession } from "@/lib/game";
import type { BoardSlot, ChordCard } from "@/types";

/** 画面フェーズ: パック待機 → 開封演出 → 中身公開 → 作曲ボード */
export type Phase = "pack" | "opening" | "revealed" | "playing";

type GameState = {
  session: GameSession | null;
  phase: Phase;
  /** 再生中にハイライトする小節インデックス(-1=なし) */
  playingStep: number;
  isPlaying: boolean;

  setPhase: (phase: Phase) => void;
  /** パックを開封して新しいセッションを生成 */
  openPack: () => void;
  newGame: () => void;
  reset: () => void;
  /** 手札のカードをスロットに配置する */
  placeCard: (cardId: string, slotId: string) => void;
  /** スロットのカードを手札に戻す */
  removeFromSlot: (slotId: string) => void;
  setPlayingStep: (step: number) => void;
  setIsPlaying: (playing: boolean) => void;
};

export const useGameStore = create<GameState>((set, get) => ({
  session: null,
  phase: "pack",
  playingStep: -1,
  isPlaying: false,

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
      // セクションが一致しないスロットには置けない
      if (slot.id === slotId) {
        if (slot.section !== card.section) return slot;
        return { ...slot, cardId };
      }
      // 同じカードが他スロットにあれば外す(移動)
      if (slot.cardId === cardId) return { ...slot, cardId: null };
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

  setPlayingStep: (step) => set({ playingStep: step }),
  setIsPlaying: (playing) =>
    set({ isPlaying: playing, ...(playing ? {} : { playingStep: -1 }) }),
}));

/** 手札 = 配られたカードのうち、どのスロットにも置かれていないもの */
export function selectHand(session: GameSession | null): ChordCard[] {
  if (!session) return [];
  const placed = new Set(
    session.board.map((s) => s.cardId).filter(Boolean) as string[],
  );
  return Object.values(session.dealtCards).filter((c) => !placed.has(c.id));
}

export type { ChordCard };
