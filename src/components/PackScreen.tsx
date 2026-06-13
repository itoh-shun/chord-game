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
        <h1 className="bg-gradient-to-r from-pop-cyan via-pop-pink to-pop-purple bg-clip-text text-4xl font-black tracking-wide text-transparent drop-shadow-sm">
          🎵 作曲酒場
        </h1>
        <p className="mt-2 text-sm font-bold text-foreground/60">
          パックを開けて、今日の作曲セットを引こう！
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
          className={`holo relative h-[380px] w-[260px] overflow-hidden rounded-[28px] shadow-2xl ring-4 ring-white/70 ${
            opening ? "pack-burst" : "pack-shine"
          }`}
          style={{
            background:
              "linear-gradient(150deg,#28d4ff 0%,#a855f7 38%,#ff2e93 70%,#ffd23f 100%)",
          }}
        >
          {/* 上部の封 */}
          <div className="absolute inset-x-0 top-0 h-12 border-b-[3px] border-dashed border-white/70 bg-white/15" />
          <div className="flex h-full flex-col items-center justify-center gap-4 px-5 text-center">
            <span className="text-7xl drop-shadow-lg">🎵</span>
            <span className="text-2xl font-black tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
              作曲酒場
            </span>
            <span className="text-[11px] font-bold tracking-[0.3em] text-white/90">
              CHORD PACK vol.1
            </span>
            <span className="mt-2 rounded-full bg-white/30 px-3 py-1 text-[10px] font-black text-white ring-1 ring-white/60">
              客 ・ お題 ・ 店長 ・ コード
            </span>
          </div>
        </div>
      </button>

      {!opening && (
        <p className="mt-8 animate-bounce text-base font-black text-accent drop-shadow-sm">
          タップして開封 ▲
        </p>
      )}
    </div>
  );
}
