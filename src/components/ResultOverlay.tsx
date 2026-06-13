"use client";

import { useSongStore, INSTRUMENTS } from "@/store/songStore";

export function ResultOverlay() {
  const result = useSongStore((s) => s.result);
  const justUnlocked = useSongStore((s) => s.justUnlocked);
  const closeResult = useSongStore((s) => s.closeResult);
  const nextChallenge = useSongStore((s) => s.nextChallenge);
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="閉じる"
        onClick={closeResult}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-[420px] rounded-3xl bg-white p-5 shadow-2xl">
        <p className="text-center text-xs font-black tracking-widest text-pop-purple">
          RESULT
        </p>
        {/* 星 */}
        <div className="mt-1 flex justify-center gap-1">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`deal-in text-5xl ${i <= result.stars ? "" : "opacity-20 grayscale"}`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              ⭐
            </span>
          ))}
        </div>
        <p className="mt-2 text-center text-4xl font-black text-foreground">
          {result.total}
          <span className="text-lg text-foreground/40"> 点</span>
        </p>
        <p className="mt-1 text-center text-sm font-bold text-foreground/70">
          {result.comment}
        </p>

        {/* 内訳 */}
        <div className="mt-3 space-y-1.5">
          {result.lines.map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <span className="w-24 shrink-0 text-[11px] font-bold text-foreground/60">
                {l.label}
              </span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-pop-cyan to-pop-purple"
                  style={{ width: `${(l.got / l.max) * 100}%` }}
                />
              </span>
              <span className="w-10 text-right text-[11px] font-black text-foreground/60">
                {l.got}/{l.max}
              </span>
            </div>
          ))}
        </div>

        {/* 報酬 */}
        <div className="mt-3 rounded-2xl bg-pop-yellow/20 py-2 text-center font-black text-foreground">
          🪙 +{result.coins} コイン獲得！
        </div>
        {justUnlocked.length > 0 && (
          <div className="mt-2 rounded-2xl bg-pop-lime/30 py-2 text-center text-sm font-black text-emerald-700">
            🎉 新しい楽器を解放:{" "}
            {justUnlocked
              .map((id) => INSTRUMENTS.find((i) => i.id === id)?.label ?? id)
              .join("・")}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={closeResult}
            className="flex-1 rounded-2xl bg-white py-3 font-black text-foreground/70 ring-2 ring-stone-200 active:scale-95"
          >
            手直しする
          </button>
          <button
            type="button"
            onClick={nextChallenge}
            className="flex-1 rounded-2xl bg-gradient-to-r from-pop-cyan to-pop-purple py-3 font-black text-white shadow-lg active:scale-95"
          >
            次のお題 →
          </button>
        </div>
      </div>
    </div>
  );
}
