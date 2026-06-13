"use client";

import { useGameStore } from "@/store/gameStore";
import { usePlayback } from "@/hooks/usePlayback";

export function Controls() {
  const newGame = useGameStore((s) => s.newGame);
  const { play, stop, isPlaying, canPlay, placedCount, totalSlots } =
    usePlayback();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {isPlaying ? (
        <button
          type="button"
          onClick={stop}
          className="rounded-lg bg-accent px-5 py-2.5 font-bold text-white shadow transition hover:brightness-110"
        >
          ■ 停止
        </button>
      ) : (
        <button
          type="button"
          onClick={play}
          disabled={!canPlay}
          className="rounded-lg bg-brass px-5 py-2.5 font-bold text-wood-dark shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ▶ コード進行を再生
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          stop();
          newGame();
        }}
        className="rounded-lg bg-wood-light px-5 py-2.5 font-bold text-foreground shadow transition hover:brightness-110"
      >
        🎲 新しい依頼
      </button>

      <span className="text-sm text-brass/80">
        配置: {placedCount} / {totalSlots} 小節枠
      </span>
    </div>
  );
}
