"use client";

import { useSongStore } from "@/store/songStore";
import { CHROMATIC_KEYS } from "@/lib/music";
import { INSTRUMENTS } from "@/lib/audio";

export function TopBar() {
  const mode = useSongStore((s) => s.mode);
  const setMode = useSongStore((s) => s.setMode);
  const song = useSongStore((s) => s.song);
  const setKey = useSongStore((s) => s.setKey);
  const setTempo = useSongStore((s) => s.setTempo);
  const instrument = useSongStore((s) => s.instrument);
  const setInstrument = useSongStore((s) => s.setInstrument);

  return (
    <header className="sticky top-0 z-30 bg-background/85 px-3 pt-3 pb-2 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="bg-gradient-to-r from-pop-cyan via-pop-pink to-pop-purple bg-clip-text text-xl font-black tracking-wide text-transparent">
          🎛️ CHORD STUDIO
        </h1>
        {/* モード切替 */}
        <div className="flex rounded-full bg-white p-1 shadow ring-2 ring-pop-purple/30">
          {(["compose", "jam"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-sm font-black transition ${
                mode === m
                  ? "bg-gradient-to-r from-pop-purple to-pop-pink text-white"
                  : "text-foreground/50"
              }`}
            >
              {m === "compose" ? "作曲" : "ジャム"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* キー */}
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

        {/* テンポ */}
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

        {/* 楽器 */}
        <label className="flex items-center gap-1 rounded-xl bg-white px-2 py-1 text-sm font-black shadow ring-1 ring-stone-200">
          <select
            value={instrument}
            onChange={(e) =>
              setInstrument(e.target.value as typeof instrument)
            }
            className="bg-transparent font-black outline-none"
          >
            {INSTRUMENTS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.emoji} {i.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
