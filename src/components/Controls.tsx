"use client";

import { useGameStore } from "@/store/gameStore";
import { usePlayback } from "@/hooks/usePlayback";

export function Controls() {
  const reset = useGameStore((s) => s.reset);
  const { play, stop, isPlaying, canPlay, placedCount, totalSlots } =
    usePlayback();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {isPlaying ? (
        <button
          type="button"
          onClick={stop}
          className="rounded-2xl bg-accent px-5 py-2.5 font-black text-white shadow-lg ring-2 ring-white/60 transition active:scale-95"
        >
          ■ 停止
        </button>
      ) : (
        <button
          type="button"
          onClick={play}
          disabled={!canPlay}
          className="flex-1 rounded-2xl bg-gradient-to-r from-pop-cyan via-pop-purple to-pop-pink px-5 py-2.5 font-black text-white shadow-lg ring-2 ring-white/60 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:ring-0"
        >
          ▶ コード進行を再生
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          stop();
          reset();
        }}
        className="rounded-2xl bg-white px-4 py-2.5 font-black text-foreground shadow ring-2 ring-pop-yellow/70 transition active:scale-95"
      >
        🎴 新パック
      </button>

      <span className="text-sm font-bold text-brass/80">
        {placedCount} / {totalSlots}
      </span>
    </div>
  );
}
