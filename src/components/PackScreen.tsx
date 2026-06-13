"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

export function PackScreen() {
  const phase = useGameStore((s) => s.phase);
  const openPack = useGameStore((s) => s.openPack);
  const setPhase = useGameStore((s) => s.setPhase);
  const opening = phase === "opening";

  // 開封演出が終わったら中身公開へ
  useEffect(() => {
    if (!opening) return;
    const t = setTimeout(() => setPhase("revealed"), 720);
    return () => clearTimeout(t);
  }, [opening, setPhase]);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col items-center justify-center px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black tracking-wide text-brass-bright drop-shadow">
          🍻 作曲酒場
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          パックを開けて、今日の作曲セットを引こう
        </p>
      </div>

      {/* フラッシュ */}
      {opening && (
        <div className="flash-out pointer-events-none fixed inset-0 z-50 bg-white" />
      )}

      <button
        type="button"
        onClick={() => !opening && openPack()}
        disabled={opening}
        aria-label="パックを開封する"
        className={`relative ${opening ? "" : "pack-idle"}`}
      >
        <div
          className={`relative h-[380px] w-[260px] overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/20 ${
            opening ? "pack-burst" : "pack-shine"
          }`}
          style={{
            background:
              "linear-gradient(160deg,#3a2516 0%,#5a3a22 35%,#2a1b10 70%,#1c130c 100%)",
          }}
        >
          {/* 上部の封 */}
          <div className="absolute inset-x-0 top-0 h-12 border-b-2 border-dashed border-brass/40 bg-black/30" />
          <div className="flex h-full flex-col items-center justify-center gap-4 px-5 text-center">
            <span className="text-6xl drop-shadow-lg">🎼</span>
            <span className="text-xl font-black tracking-widest text-brass-bright drop-shadow">
              作曲酒場
            </span>
            <span className="text-[11px] tracking-[0.3em] text-brass/70">
              CHORD PACK vol.1
            </span>
            <span className="mt-2 rounded-full bg-brass/20 px-3 py-1 text-[10px] text-brass-bright ring-1 ring-brass/40">
              客 ・ お題 ・ 店長 ・ コード
            </span>
          </div>
        </div>
      </button>

      {!opening && (
        <p className="mt-8 animate-pulse text-sm font-bold text-brass-bright">
          タップして開封 ▲
        </p>
      )}
    </div>
  );
}
