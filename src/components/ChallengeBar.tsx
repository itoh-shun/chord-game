"use client";

import { useSongStore } from "@/store/songStore";

export function ChallengeBar() {
  const brief = useSongStore((s) => s.brief);
  const song = useSongStore((s) => s.song);
  const submit = useSongStore((s) => s.submitChallenge);
  if (!brief) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-pop-yellow/40 to-pop-pink/30 p-[2px] shadow">
      <div className="rounded-2xl bg-white/90 p-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧑‍🎤</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-foreground/50">お客さんの依頼</p>
            <p className="truncate text-base font-black text-foreground">
              {brief.customer}
            </p>
          </div>
          <span className="rounded-full bg-pop-cyan/20 px-2 py-0.5 text-xs font-black text-foreground/70">
            {brief.genre}
          </span>
          <span className="rounded-full bg-pop-pink/20 px-2 py-0.5 text-xs font-black text-foreground/70">
            {brief.mood}
          </span>
        </div>

        <ul className="mt-2 flex flex-wrap gap-1.5">
          {brief.rules.map((r) => {
            const ok = r.check(song);
            return (
              <li
                key={r.id}
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  ok
                    ? "bg-pop-lime/40 text-emerald-700 ring-1 ring-pop-lime"
                    : "bg-stone-100 text-stone-400"
                }`}
              >
                {ok ? "✓" : "・"} {r.label}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={submit}
          className="mt-3 w-full rounded-2xl bg-gradient-to-r from-pop-pink to-pop-purple py-2.5 font-black text-white shadow-lg ring-2 ring-white/60 active:scale-95"
        >
          🎤 この曲を提出する
        </button>
      </div>
    </div>
  );
}
