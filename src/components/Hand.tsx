"use client";

import { useGameStore, selectHand } from "@/store/gameStore";
import { DraggableChordCard } from "@/components/ChordCardView";

export function Hand() {
  const session = useGameStore((s) => s.session);
  const hand = selectHand(session);

  return (
    <section className="rounded-xl bg-wood-dark/80 p-4 shadow-lg ring-1 ring-brass/50">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-brass-bright">
        手札 ({hand.length})
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
