"use client";

import { useSongStore } from "@/store/songStore";
import { IDEA_MOODS } from "@/lib/ideas";

export function IdeaBar() {
  const ideaMood = useSongStore((s) => s.ideaMood);
  const setIdeaMood = useSongStore((s) => s.setIdeaMood);
  const generateIdea = useSongStore((s) => s.generateIdea);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-pop-cyan/30 to-pop-purple/30 p-[2px] shadow">
      <div className="rounded-2xl bg-white/90 p-3">
        <p className="mb-1.5 text-xs font-black text-foreground/60">
          💡 コード進行のアイデアを出す
        </p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {IDEA_MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setIdeaMood(m)}
              className={`rounded-full px-3 py-1 text-xs font-black transition active:scale-95 ${
                ideaMood === m
                  ? "bg-pop-purple text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={generateIdea}
          className="w-full rounded-2xl bg-gradient-to-r from-pop-cyan to-pop-pink py-2.5 font-black text-white shadow-lg ring-2 ring-white/60 active:scale-95"
        >
          🎲 {ideaMood}な進行を生成（おまかせ）
        </button>
      </div>
    </div>
  );
}
