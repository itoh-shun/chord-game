"use client";

import { useGameStore } from "@/store/gameStore";
import { usePlayback } from "@/hooks/usePlayback";

export function Controls() {
  const reset = useGameStore((s) => s.reset);
  const drums = useGameStore((s) => s.drums);
  const toggleDrums = useGameStore((s) => s.toggleDrums);
  const autoFill = useGameStore((s) => s.autoFill);
  const clearBoard = useGameStore((s) => s.clearBoard);
  const {
    play,
    stop,
    exportMidi,
    isPlaying,
    audioLoading,
    canPlay,
    placedCount,
    totalSlots,
    instrumentLabel,
  } = usePlayback();

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
          disabled={!canPlay || audioLoading}
          className="flex-1 rounded-2xl bg-gradient-to-r from-pop-cyan via-pop-purple to-pop-pink px-5 py-2.5 font-black text-white shadow-lg ring-2 ring-white/60 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:ring-0"
        >
          {audioLoading ? "🎵 音源読み込み中…" : "▶ コード進行を再生"}
        </button>
      )}

      <button
        type="button"
        onClick={exportMidi}
        disabled={placedCount === 0}
        title="MIDIファイルを書き出す"
        className="rounded-2xl bg-white px-4 py-2.5 font-black text-foreground shadow ring-2 ring-pop-purple/50 transition active:scale-95 disabled:opacity-40"
      >
        🎼 MIDI
      </button>

      <button
        type="button"
        onClick={() => {
          stop();
          autoFill();
        }}
        className="rounded-2xl bg-gradient-to-r from-pop-lime to-pop-cyan px-4 py-2.5 font-black text-white shadow ring-2 ring-white/60 transition active:scale-95"
      >
        🎲 おまかせ配置
      </button>

      <button
        type="button"
        onClick={() => {
          stop();
          clearBoard();
        }}
        disabled={placedCount === 0}
        className="rounded-2xl bg-white px-4 py-2.5 font-black text-foreground/70 shadow ring-2 ring-foreground/15 transition active:scale-95 disabled:opacity-40"
      >
        🧹 クリア
      </button>

      <button
        type="button"
        onClick={toggleDrums}
        aria-pressed={drums}
        title="ドラムのオン/オフ"
        className={`rounded-2xl px-4 py-2.5 font-black shadow ring-2 transition active:scale-95 ${
          drums
            ? "bg-pop-lime/30 text-foreground ring-pop-lime"
            : "bg-white/70 text-foreground/50 ring-foreground/15"
        }`}
      >
        🥁 {drums ? "ON" : "OFF"}
      </button>

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
      <span className="rounded-full bg-pop-cyan/20 px-2.5 py-1 text-xs font-black text-foreground/70">
        🎸 {instrumentLabel}
      </span>
    </div>
  );
}
