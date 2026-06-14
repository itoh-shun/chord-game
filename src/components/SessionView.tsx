"use client";

import { useSongStore, songToEvents } from "@/store/songStore";
import { scaleNotes } from "@/lib/music";
import { ChordDiagram } from "@/components/ChordDiagram";

export function SessionView() {
  const song = useSongStore((s) => s.song);
  const current = useSongStore((s) => s.current);
  const isPlaying = useSongStore((s) => s.isPlaying);
  const beat = useSongStore((s) => s.beat);
  const beatsLeft = useSongStore((s) => s.chordBeatsLeft);
  const groove = useSongStore((s) => s.groove);
  const jamSection = useSongStore((s) => s.jamSection);
  const flash = useSongStore((s) => s.flash);
  const transposeBy = useSongStore((s) => s.transposeBy);
  const setTempo = useSongStore((s) => s.setTempo);
  const tapTempo = useSongStore((s) => s.tapTempo);
  const setGroove = useSongStore((s) => s.setGroove);
  const jumpSection = useSongStore((s) => s.jumpSection);
  const hype = useSongStore((s) => s.hype);

  const useSong = jamSection
    ? { ...song, sections: song.sections.filter((s) => s.id === jamSection) }
    : song;
  const events = songToEvents(useSong);
  if (!events.length) return null;
  const idx = current >= 0 ? current % events.length : 0;
  const cur = events[idx];
  const next = events[(idx + 1) % events.length];
  const changing = isPlaying && beatsLeft <= 1;

  const grLabel = ["静か", "普通", "熱い"];

  return (
    <div className="relative space-y-3">
      {/* 盛り上げフラッシュ */}
      {flash > 0 && (
        <div
          key={flash}
          className="flash-out pointer-events-none fixed inset-0 z-40 bg-gradient-to-br from-pop-yellow via-pop-pink to-pop-purple"
        />
      )}
      {flash > 0 && (
        <div
          key={`p${flash}`}
          className="deal-in pointer-events-none fixed inset-0 z-40 flex items-center justify-center text-7xl font-black"
        >
          🔥🎉🔥
        </div>
      )}

      {/* 今のコード */}
      <div
        className={`rounded-3xl p-[3px] shadow-xl transition-colors ${
          changing ? "bg-pop-yellow" : "bg-gradient-to-br from-pop-purple to-pop-pink"
        }`}
      >
        <div className="flex flex-col items-center rounded-3xl bg-white px-4 py-5">
          {/* ビートパルス */}
          <div className="mb-2 flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`rounded-full transition-all ${
                  beat === i
                    ? i === 0
                      ? "h-3.5 w-3.5 bg-pop-pink"
                      : "h-3.5 w-3.5 bg-pop-cyan"
                    : "h-2.5 w-2.5 bg-stone-200"
                }`}
              />
            ))}
          </div>
          <span className="text-6xl font-black text-stone-800">{cur.name}</span>
          <div className="mt-2 scale-[1.5]">
            <ChordDiagram chordName={cur.name} size={1.2} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-bold text-stone-400">次は</span>
            <span
              className={`rounded-xl px-3 py-1 text-2xl font-black transition-colors ${
                changing ? "bg-pop-yellow/40 text-stone-800" : "bg-stone-100 text-stone-500"
              }`}
            >
              {next.name}
            </span>
            {isPlaying && (
              <span className="text-xs font-black text-pop-purple">
                あと{beatsLeft}拍
              </span>
            )}
          </div>
        </div>
      </div>

      {/* セクションへジャンプ */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-bold text-foreground/50">飛ぶ:</span>
        <button
          type="button"
          onClick={() => jumpSection(null)}
          className={`rounded-full px-3 py-1 text-xs font-black active:scale-95 ${
            jamSection === null ? "bg-pop-purple text-white" : "bg-white text-foreground/60 ring-1 ring-stone-200"
          }`}
        >
          曲全体
        </button>
        {song.sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => jumpSection(s.id)}
            className={`rounded-full px-3 py-1 text-xs font-black active:scale-95 ${
              jamSection === s.id ? "bg-pop-pink text-white" : "bg-white text-foreground/60 ring-1 ring-stone-200"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* キー / テンポ */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => transposeBy(-1)}
          className="h-11 w-11 rounded-2xl bg-white text-xl font-black text-stone-700 shadow ring-2 ring-pop-cyan/50 active:scale-95"
        >
          −
        </button>
        <span className="flex flex-col items-center px-1">
          <span className="text-[10px] font-bold text-foreground/50">KEY</span>
          <span className="text-2xl font-black text-foreground">{song.key}</span>
        </span>
        <button
          type="button"
          onClick={() => transposeBy(1)}
          className="h-11 w-11 rounded-2xl bg-white text-xl font-black text-stone-700 shadow ring-2 ring-pop-pink/50 active:scale-95"
        >
          ＋
        </button>

        <span className="mx-1 h-8 w-px bg-stone-200" />

        <button
          type="button"
          onClick={() => setTempo(song.tempo - 4)}
          className="h-11 w-9 rounded-2xl bg-white text-lg font-black text-stone-700 shadow active:scale-95"
        >
          −
        </button>
        <span className="flex flex-col items-center px-1">
          <span className="text-[10px] font-bold text-foreground/50">♩ BPM</span>
          <span className="text-2xl font-black text-foreground">{song.tempo}</span>
        </span>
        <button
          type="button"
          onClick={() => setTempo(song.tempo + 4)}
          className="h-11 w-9 rounded-2xl bg-white text-lg font-black text-stone-700 shadow active:scale-95"
        >
          ＋
        </button>
        <button
          type="button"
          onClick={tapTempo}
          className="h-11 rounded-2xl bg-pop-cyan px-3 text-sm font-black text-white shadow active:scale-90"
        >
          TAP
        </button>
      </div>

      {/* グルーヴ */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs font-bold text-foreground/50">グルーヴ:</span>
        {[0, 1, 2].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroove(g)}
            className={`rounded-full px-4 py-1.5 text-sm font-black active:scale-95 ${
              groove === g
                ? "bg-gradient-to-r from-pop-cyan to-pop-purple text-white"
                : "bg-white text-foreground/60 ring-1 ring-stone-200"
            }`}
          >
            {["🌙", "🎵", "🔥"][g]} {grLabel[g]}
          </button>
        ))}
      </div>

      {/* ソロの目安 */}
      <div className="rounded-2xl bg-white/80 p-2 text-center ring-2 ring-pop-lime/50">
        <span className="text-[11px] font-bold text-foreground/50">
          ソロの目安:
        </span>
        <span className="text-base font-black tracking-wide text-foreground">
          {scaleNotes(song.key).join(" ")}
        </span>
      </div>

      {/* HYPE */}
      <button
        type="button"
        onClick={hype}
        className="w-full rounded-2xl bg-gradient-to-r from-pop-orange via-pop-pink to-pop-purple py-4 text-lg font-black text-white shadow-xl ring-2 ring-white/60 transition active:scale-95"
      >
        🔥 HYPE！（キーUP＋盛り上げ）
      </button>
    </div>
  );
}
