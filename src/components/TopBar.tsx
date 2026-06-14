"use client";

import { useSongStore } from "@/store/songStore";
import { CHROMATIC_KEYS } from "@/lib/music";
import { INSTRUMENTS } from "@/lib/audio";
import type { Mode } from "@/types";

const MODE_LABEL: Record<Mode, string> = {
  combine: "つなぐ",
  play: "あそぶ",
  compose: "作曲",
  jam: "セッション",
};

export function TopBar() {
  const mode = useSongStore((s) => s.mode);
  const setMode = useSongStore((s) => s.setMode);
  const song = useSongStore((s) => s.song);
  const setKey = useSongStore((s) => s.setKey);
  const setTempo = useSongStore((s) => s.setTempo);
  const instrument = useSongStore((s) => s.instrument);
  const setInstrument = useSongStore((s) => s.setInstrument);
  const unlocked = useSongStore((s) => s.unlocked);
  const coins = useSongStore((s) => s.coins);

  return (
    <header className="sticky top-0 z-30 bg-background/85 px-3 pt-3 pb-2 backdrop-blur">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h1 className="bg-gradient-to-r from-pop-cyan via-pop-pink to-pop-purple bg-clip-text text-lg font-black tracking-wide text-transparent">
          🎛️ CHORD STUDIO
        </h1>
        <span className="rounded-full bg-pop-yellow/30 px-2.5 py-0.5 text-sm font-black text-foreground">
          🪙 {coins}
        </span>
      </div>

      {/* モード切替 */}
      <div className="mb-2 flex rounded-full bg-white p-1 shadow ring-2 ring-pop-purple/30">
        {(["combine", "play", "compose", "jam"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full py-1 text-sm font-black transition ${
              mode === m
                ? "bg-gradient-to-r from-pop-purple to-pop-pink text-white"
                : "text-foreground/50"
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 rounded-xl bg-white px-2 py-1 text-sm font-black shadow ring-1 ring-stone-200">
          <span className="text-[11px] text-foreground/50">KEY</span>
          <select
            value={song.key}
            onChange={(e) => setKey(e.target.value)}
            className="bg-transparent font-black outline-none"
          >
            {CHROMATIC_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <span className="flex items-center gap-1 rounded-xl bg-white px-2 py-1 text-sm font-black shadow ring-1 ring-stone-200">
          <span className="text-[11px] text-foreground/50">♩</span>
          <button
            type="button"
            onClick={() => setTempo(song.tempo - 4)}
            className="h-6 w-6 rounded-full bg-stone-100 leading-none"
          >
            −
          </button>
          <span className="w-9 text-center tabular-nums">{song.tempo}</span>
          <button
            type="button"
            onClick={() => setTempo(song.tempo + 4)}
            className="h-6 w-6 rounded-full bg-stone-100 leading-none"
          >
            ＋
          </button>
        </span>

        <label className="flex items-center gap-1 rounded-xl bg-white px-2 py-1 text-sm font-black shadow ring-1 ring-stone-200">
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value as typeof instrument)}
            className="bg-transparent font-black outline-none"
          >
            {INSTRUMENTS.map((i) => {
              const locked = !unlocked.includes(i.id);
              return (
                <option key={i.id} value={i.id} disabled={locked}>
                  {i.emoji} {i.label}
                  {locked ? " 🔒" : ""}
                </option>
              );
            })}
          </select>
        </label>
      </div>
    </header>
  );
}
