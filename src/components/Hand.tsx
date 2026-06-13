"use client";

import { useGameStore, selectHand } from "@/store/gameStore";
import { DraggableChordCard } from "@/components/ChordCardView";

export function Hand() {
  const session = useGameStore((s) => s.session);
  const hand = selectHand(session);

  return (
    <section className="rounded-2xl bg-wood-dark/90 p-4 shadow-[0_6px_0_rgba(0,0,0,0.06)] ring-2 ring-pop-cyan/50">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-black tracking-wide text-brass">
        🎴 手札 ({hand.length})
      </h2>
      {hand.length === 0 ? (
        <p className="text-sm text-foreground/60">
          手札はすべて配置済みです。再生してみましょう！
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {hand.map((card) => (
            <DraggableChordCard
              key={card.id}
              card={card}
              songKey={session!.key}
            />
          ))}
        </div>
      )}
    </section>
  );
}
