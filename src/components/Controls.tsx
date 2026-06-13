"use client";

import { useGameStore } from "@/store/gameStore";
import { usePlayback } from "@/hooks/usePlayback";

export function Controls() {
  const reset = useGameStore((s) => s.reset);
  const drums = useGameStore((s) => s.drums);
  const toggleDrums = useGameStore((s) => s.toggleDrums);
  const autoFill = useGameStore((s) => s.autoFill);
  const clearBoard = useGameStore((s) => s.clearBoard);
  const capo = useGameStore((s) => s.capo);
  const setCapo = useGameStore((s) => s.setCapo);
  const autoCapo = useGameStore((s) => s.autoCapo);
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

  const btn =
    "rounded-2xl px-3 py-2.5 text-sm font-black shadow transition active:scale-95 disabled:opacity-40";

  return (
    <div className="flex flex-col gap-2">
      {/* 主操作: 再生 + MIDI */}
      <div className="flex gap-2">
        {isPlaying ? (
          <button
            type="button"
            onClick={stop}
            className={`${btn} flex-1 bg-accent text-white ring-2 ring-white/60`}
          >
            ■ 停止
          </button>
        ) : (
          <button
            type="button"
            onClick={play}
            disabled={!canPlay || audioLoading}
            className={`${btn} flex-1 bg-gradient-to-r from-pop-cyan via-pop-purple to-pop-pink text-white ring-2 ring-white/60 disabled:ring-0`}
          >
            {audioLoading ? "🎵 読み込み中…" : "▶ 再生"}
          </button>
        )}
        <button
          type="button"
          onClick={exportMidi}
          disabled={placedCount === 0}
          title="MIDIファイルを書き出す"
          className={`${btn} bg-white text-foreground ring-2 ring-pop-purple/50`}
        >
          🎼 MIDI
        </button>
      </div>

      {/* 配置: おまかせ / クリア / 新パック */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            stop();
            autoFill();
          }}
          className={`${btn} flex-1 bg-gradient-to-r from-pop-lime to-pop-cyan text-white ring-2 ring-white/60`}
        >
          🎲 おまかせ
        </button>
        <button
          type="button"
          onClick={() => {
            stop();
            clearBoard();
          }}
          disabled={placedCount === 0}
          className={`${btn} flex-1 bg-white text-foreground/70 ring-2 ring-foreground/15`}
        >
          🧹 クリア
        </button>
        <button
          type="button"
          onClick={() => {
            stop();
            reset();
          }}
          className={`${btn} flex-1 bg-white text-foreground ring-2 ring-pop-yellow/70`}
        >
          🎴 新パック
        </button>
      </div>

      {/* 設定: カポ / ドラム */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="flex items-center gap-1 rounded-2xl bg-white px-2 py-1.5 text-sm font-black text-foreground shadow ring-2 ring-orange-300"
          title="カポ：押さえるコードが簡単に（鳴る音/キーは変わりません）"
        >
          <span className="text-xs">🎸カポ</span>
          <button
            type="button"
            onClick={() => setCapo(capo - 1)}
            disabled={capo === 0}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-base leading-none disabled:opacity-30"
          >
            −
          </button>
          <span className="w-4 text-center tabular-nums">{capo}</span>
          <button
            type="button"
            onClick={() => setCapo(capo + 1)}
            disabled={capo >= 7}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-base leading-none disabled:opacity-30"
          >
            ＋
          </button>
          <button
            type="button"
            onClick={autoCapo}
            className="ml-0.5 rounded-full bg-orange-500 px-2 py-0.5 text-[11px] text-white"
          >
            自動
          </button>
        </span>

        <button
          type="button"
          onClick={toggleDrums}
          aria-pressed={drums}
          title="ドラムのオン/オフ"
          className={`rounded-2xl px-3 py-1.5 text-sm font-black shadow ring-2 transition active:scale-95 ${
            drums
              ? "bg-pop-lime/30 text-foreground ring-pop-lime"
              : "bg-white/70 text-foreground/50 ring-foreground/15"
          }`}
        >
          🥁 {drums ? "ON" : "OFF"}
        </button>

        <span className="ml-auto flex items-center gap-2">
          <span className="text-sm font-bold text-brass/80">
            {placedCount}/{totalSlots}
          </span>
          <span className="rounded-full bg-pop-cyan/20 px-2.5 py-1 text-xs font-black text-foreground/70">
            🎹 {instrumentLabel}
          </span>
        </span>
      </div>
    </div>
  );
}
