// 再生制御フック: ボード状態 -> Tone.js 再生

import { useCallback } from "react";
import { useGameStore, selectHand } from "@/store/gameStore";
import { playProgression, stopProgression, type PlayStep } from "@/lib/audio";
import { romanToNotes, romanToChordName, transposeKey } from "@/lib/music";
import type { GameSession } from "@/lib/game";

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
    // ブロックの小節数を満たすよう、コード進行を繰り返して並べる
    const progLen = card.progression.length || 4;
    const repeats = Math.max(1, Math.round(slot.bars / progLen));
    for (let r = 0; r < repeats; r++) {
      card.progression.forEach((roman) => {
        steps.push({
          notes: romanToNotes(roman, useKey),
          label: romanToChordName(roman, useKey),
          slotIndex,
        });
      });
    }
  });
  return steps;
}

export function usePlayback() {
  const session = useGameStore((s) => s.session);
  const isPlaying = useGameStore((s) => s.isPlaying);
  const drums = useGameStore((s) => s.drums);
  const setIsPlaying = useGameStore((s) => s.setIsPlaying);
  const setPlayingStep = useGameStore((s) => s.setPlayingStep);

  const play = useCallback(async () => {
    if (!session) return;
    const steps = buildSteps(session);
    if (steps.length === 0) return;
    const bpm = Number(session.themes.tempo.value) || 120;

    setIsPlaying(true);
    await playProgression(
      steps,
      bpm,
      {
        onStep: (i) => setPlayingStep(steps[i].slotIndex),
        onEnd: () => setIsPlaying(false),
      },
      { drums },
    );
  }, [session, drums, setIsPlaying, setPlayingStep]);

  const stop = useCallback(() => {
    stopProgression();
    setIsPlaying(false);
  }, [setIsPlaying]);

  // 配置済みスロットが1つでもあれば再生可能
  const canPlay = !!session && session.board.some((s) => s.cardId);
  const placedCount = session
    ? session.board.filter((s) => s.cardId).length
    : 0;
  const totalSlots = session ? session.board.length : 0;
  const handRemaining = selectHand(session).length;

  return { play, stop, isPlaying, canPlay, placedCount, totalSlots, handRemaining };
}
