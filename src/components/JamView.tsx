"use client";

import { useSongStore, songToEvents } from "@/store/songStore";
import { scaleNotes } from "@/lib/music";
import { ChordDiagram } from "@/components/ChordDiagram";

export function JamView() {
  const song = useSongStore((s) => s.song);
  const current = useSongStore((s) => s.current);
  const isPlaying = useSongStore((s) => s.isPlaying);
  const countIn = useSongStore((s) => s.countIn);
  const toggleCountIn = useSongStore((s) => s.toggleCountIn);
  const transposeBy = useSongStore((s) => s.transposeBy);

  const events = songToEvents(song);
  if (!events.length) return null;
  const idx = current >= 0 ? current : 0;
  const cur = events[idx];
  const next = events[(idx + 1) % events.length];

  return (
    <div className="space-y-4">
      {/* 大きな今のコード */}
      <div className="rounded-3xl bg-gradient-to-br from-pop-purple to-pop-pink p-[3px] shadow-xl">
        <div className="flex flex-col items-center rounded-3xl bg-white px-4 py-6">
          <span className="text-xs font-black tracking-widest text-pop-purple">
            {isPlaying ? "♪ NOW PLAYING" : "TAP ▶ でセッション開始"}
          </span>
          <span className="mt-1 text-6xl font-black text-stone-800">
            {cur.name}
          </span>
          <div className="mt-2 scale-[1.6]">
            <ChordDiagram chordName={cur.name} size={1.2} />
          </div>
          <div className="mt-5 flex items-center gap-2 text-stone-400">
            <span className="text-sm font-bold">次は</span>
            <span className="rounded-xl bg-stone-100 px-3 py-1 text-2xl font-black text-stone-600">
              {next.name}
            </span>
          </div>
        </div>
      </div>

      {/* 進行ドット */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {events.map((e, i) => (
          <span
            key={e.cellId}
            className={`h-2.5 rounded-full transition-all ${
              i === idx ? "w-6 bg-pop-pink" : "w-2.5 bg-stone-300"
            }`}
          />
        ))}
      </div>

      {/* 転調(キー即変更) */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => transposeBy(-1)}
          className="h-12 w-12 rounded-2xl bg-white text-2xl font-black text-stone-700 shadow ring-2 ring-pop-cyan/50 active:scale-95"
        >
          −
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-bold text-foreground/50">KEY</span>
          <span className="text-3xl font-black text-foreground">{song.key}</span>
        </div>
        <button
          type="button"
          onClick={() => transposeBy(1)}
          className="h-12 w-12 rounded-2xl bg-white text-2xl font-black text-stone-700 shadow ring-2 ring-pop-pink/50 active:scale-95"
        >
          ＋
        </button>
      </div>

      {/* ソロの目安スケール */}
      <div className="rounded-2xl bg-white/80 p-3 text-center ring-2 ring-pop-lime/50">
        <p className="text-[11px] font-bold text-foreground/50">
          ソロの目安（{song.key} メジャースケール）
        </p>
        <p className="mt-1 text-lg font-black tracking-wide text-foreground">
          {scaleNotes(song.key).join("  ")}
        </p>
      </div>

      {/* カウントイン */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={toggleCountIn}
          aria-pressed={countIn}
          className={`rounded-2xl px-4 py-2 text-sm font-black shadow ring-2 active:scale-95 ${
            countIn
              ? "bg-pop-yellow/30 text-foreground ring-pop-yellow"
              : "bg-white/70 text-foreground/50 ring-foreground/15"
          }`}
        >
          🥁 カウントイン {countIn ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}
