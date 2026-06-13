"use client";

import { useSongStore } from "@/store/songStore";
import { QUALITIES, cellChordName, cellToRoman } from "@/lib/music";
import { nextSuggestions } from "@/lib/ideas";
import { ChordDiagram } from "@/components/ChordDiagram";
import type { Quality } from "@/types";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
const BEATS = [1, 2, 3, 4, 6, 8];

export function ChordEditor() {
  const editing = useSongStore((s) => s.editing);
  const song = useSongStore((s) => s.song);
  const updateChord = useSongStore((s) => s.updateChord);
  const removeChord = useSongStore((s) => s.removeChord);
  const setEditing = useSongStore((s) => s.setEditing);

  if (!editing) return null;
  const sec = song.sections.find((x) => x.id === editing.sectionId);
  const cell = sec?.chords.find((c) => c.id === editing.chordId);
  if (!sec || !cell) return null;

  const name = cellChordName(cell, song.key);
  const set = (patch: Partial<typeof cell>) =>
    updateChord(sec.id, cell.id, patch);

  // 直前のコードから「流れに合う候補」を出す
  const idx = sec.chords.findIndex((c) => c.id === cell.id);
  const prev = idx > 0 ? sec.chords[idx - 1] : null;
  const suggestions = nextSuggestions(prev ? prev.degree : 1).filter(
    (s) => !(s.degree === cell.degree && s.quality === cell.quality),
  );

  const pill = "rounded-xl px-3 py-2 text-sm font-black transition active:scale-95";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="閉じる"
        onClick={() => setEditing(null)}
        className="absolute inset-0 bg-black/30"
      />
      <div className="relative w-full max-w-[480px] rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-stone-300" />
        <div className="mb-3 flex items-center gap-3">
          <ChordDiagram chordName={name} size={1.3} />
          <div>
            <div className="text-2xl font-black text-stone-800">{name}</div>
            <div className="text-xs text-stone-400">{cellToRoman(cell)}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              removeChord(sec.id, cell.id);
              setEditing(null);
            }}
            className="ml-auto rounded-xl bg-rose-100 px-3 py-2 text-sm font-black text-rose-600"
          >
            🗑 削除
          </button>
        </div>

        {suggestions.length > 0 && (
          <>
            <p className="mb-1 text-xs font-bold text-stone-400">
              💡 流れに合う候補（タップで置換）
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => {
                const label = cellChordName(
                  { id: "x", degree: s.degree, quality: s.quality, accidental: 0, beats: 4 },
                  song.key,
                );
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => set({ degree: s.degree, quality: s.quality, accidental: 0 })}
                    className={`${pill} bg-pop-cyan/20 text-foreground`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <p className="mb-1 text-xs font-bold text-stone-400">度数（スケールの何番目）</p>
        <div className="mb-3 grid grid-cols-7 gap-1">
          {ROMAN.map((r, i) => (
            <button
              key={r}
              type="button"
              onClick={() => set({ degree: i + 1 })}
              className={`${pill} ${cell.degree === i + 1 ? "bg-pop-purple text-white" : "bg-stone-100 text-stone-700"}`}
            >
              {r}
            </button>
          ))}
        </div>

        <p className="mb-1 text-xs font-bold text-stone-400">種類</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {QUALITIES.map((q) => (
            <button
              key={q.id || "maj"}
              type="button"
              onClick={() => set({ quality: q.id as Quality })}
              className={`${pill} ${cell.quality === q.id ? "bg-pop-pink text-white" : "bg-stone-100 text-stone-700"}`}
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex items-center gap-4">
          <div>
            <p className="mb-1 text-xs font-bold text-stone-400">借用(♭/♯)</p>
            <div className="flex gap-1">
              {[-1, 0, 1].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => set({ accidental: a })}
                  className={`${pill} ${cell.accidental === a ? "bg-orange-500 text-white" : "bg-stone-100 text-stone-700"}`}
                >
                  {a === -1 ? "♭" : a === 1 ? "♯" : "♮"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <p className="mb-1 text-xs font-bold text-stone-400">長さ（拍）</p>
            <div className="flex flex-wrap gap-1">
              {BEATS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => set({ beats: b })}
                  className={`${pill} ${cell.beats === b ? "bg-pop-cyan text-white" : "bg-stone-100 text-stone-700"}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditing(null)}
          className="w-full rounded-2xl bg-gradient-to-r from-pop-cyan to-pop-purple py-3 font-black text-white shadow-lg active:scale-95"
        >
          完了
        </button>
      </div>
    </div>
  );
}
