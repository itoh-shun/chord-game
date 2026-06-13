"use client";

import { useSongStore } from "@/store/songStore";

export function PlayBar() {
  const isPlaying = useSongStore((s) => s.isPlaying);
  const audioLoading = useSongStore((s) => s.audioLoading);
  const drums = useSongStore((s) => s.drums);
  const mode = useSongStore((s) => s.mode);
  const play = useSongStore((s) => s.play);
  const stop = useSongStore((s) => s.stop);
  const toggleDrums = useSongStore((s) => s.toggleDrums);
  const exportMidi = useSongStore((s) => s.exportMidi);
  const newSong = useSongStore((s) => s.newSong);

  return (
    <div className="sticky bottom-0 z-30 mx-auto w-full max-w-[480px] bg-gradient-to-t from-background via-background to-transparent px-3 pb-3 pt-6">
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <button
            type="button"
            onClick={stop}
            className="flex-1 rounded-2xl bg-accent py-3 text-base font-black text-white shadow-lg ring-2 ring-white/60 active:scale-95"
          >
            ■ ストップ
          </button>
        ) : (
          <button
            type="button"
            onClick={() => play()}
            disabled={audioLoading}
            className="flex-1 rounded-2xl bg-gradient-to-r from-pop-cyan via-pop-purple to-pop-pink py-3 text-base font-black text-white shadow-lg ring-2 ring-white/60 active:scale-95 disabled:opacity-50"
          >
            {audioLoading
              ? "🎵 読み込み中…"
              : mode === "jam"
                ? "▶ セッション開始（ループ）"
                : "▶ 再生"}
          </button>
        )}
        <button
          type="button"
          onClick={toggleDrums}
          aria-pressed={drums}
          title="ドラム"
          className={`rounded-2xl px-3 py-3 text-sm font-black shadow ring-2 active:scale-95 ${
            drums
              ? "bg-pop-lime/30 text-foreground ring-pop-lime"
              : "bg-white/70 text-foreground/40 ring-foreground/15"
          }`}
        >
          🥁
        </button>
        <button
          type="button"
          onClick={exportMidi}
          title="MIDI書き出し"
          className="rounded-2xl bg-white px-3 py-3 text-sm font-black text-foreground shadow ring-2 ring-pop-purple/40 active:scale-95"
        >
          🎼
        </button>
        <button
          type="button"
          onClick={newSong}
          title="新規"
          className="rounded-2xl bg-white px-3 py-3 text-sm font-black text-foreground/70 shadow ring-2 ring-pop-yellow/60 active:scale-95"
        >
          🆕
        </button>
      </div>
    </div>
  );
}
