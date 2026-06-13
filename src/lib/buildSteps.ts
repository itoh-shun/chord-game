// ボード状態 -> 再生ステップ(小節ごと)への変換

import { romanToNotes, romanToChordName, transposeKey } from "@/lib/music";
import type { GameSession } from "@/lib/game";
import type { PlayStep } from "@/lib/audio";

export type BuiStep = PlayStep & { slotIndex: number };

/** ボード状態から再生ステップ(=小節ごと)を構築する */
export function buildSteps(session: GameSession): BuiStep[] {
  const { board, dealtCards, key, modulationSemitones } = session;
  const lastChorusIndex = board.map((s) => s.section).lastIndexOf("S");

  const steps: BuiStep[] = [];
  board.forEach((slot, slotIndex) => {
    if (!slot.cardId) return;
    const card = dealtCards[slot.cardId];
    if (!card) return;
    // 最後のサビ以降は転調キーを使う
    const useKey =
      modulationSemitones !== 0 && slotIndex >= lastChorusIndex
        ? transposeKey(key, modulationSemitones)
        : key;
    // カードの小節数(=進行の長さ)ぶんそのまま鳴らす
    card.progression.forEach((roman) => {
      steps.push({
        notes: romanToNotes(roman, useKey),
        label: romanToChordName(roman, useKey),
        slotIndex,
      });
    });
  });
  return steps;
}
