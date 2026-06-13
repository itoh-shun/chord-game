"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useGameStore } from "@/store/gameStore";
import { structureSummary } from "@/lib/game";
import type { ChordCard } from "@/types";
import {
  CustomerCardView,
  ThemeCardsView,
  SpecialCardView,
} from "@/components/InfoCards";
import { StructureBoard } from "@/components/StructureBoard";
import { Hand } from "@/components/Hand";
import { Controls } from "@/components/Controls";
import { ChordCardFace } from "@/components/ChordCardView";

export function GameBoard() {
  const session = useGameStore((s) => s.session);
  const placeCard = useGameStore((s) => s.placeCard);
  const [activeCard, setActiveCard] = useState<ChordCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
  );

  function handleDragStart(e: DragStartEvent) {
    const card = e.active.data.current?.card as ChordCard | undefined;
    setActiveCard(card ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = e;
    if (!over) return;
    const card = active.data.current?.card as ChordCard | undefined;
    if (!card) return;
    placeCard(card.id, String(over.id));
  }

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center text-brass">
        酒場の準備中…
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCard(null)}
    >
      <div className="mx-auto w-full max-w-[480px] space-y-4 p-3 pb-8">
        <header className="flex items-center justify-between">
          <h1 className="bg-gradient-to-r from-pop-cyan via-pop-pink to-pop-purple bg-clip-text text-2xl font-black tracking-wide text-transparent">
            🎵 作曲酒場
          </h1>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-black text-brass ring-1 ring-pop-purple/30">
            Key {session.key}
            {session.modulationSemitones !== 0 && " ↗︎"}
          </span>
        </header>

        <div className="space-y-3">
          <CustomerCardView customer={session.customer} />
          <ThemeCardsView themes={session.themes} />
          <SpecialCardView
            special={session.special}
            songKey={session.key}
            modulationSemitones={session.modulationSemitones}
          />
        </div>

        <section className="rounded-xl bg-wood-dark/60 p-3 shadow-inner ring-1 ring-brass/30">
          <div className="mb-3">
            <h2 className="flex items-center gap-1.5 text-sm font-black tracking-wide text-brass">
              🎼 曲構成: {session.structure.name}
            </h2>
            <p className="mt-1 text-xs text-foreground/60">
              {(() => {
                const { chorusBars, startsWithChorus, totalBars } =
                  structureSummary(session.board);
                return `全${totalBars}小節 ・ サビ${chorusBars}小節${startsWithChorus ? " ・ 前サビ(サビ始まり)" : ""}`;
              })()}
            </p>
          </div>
          <StructureBoard />
        </section>

        <Hand />

        <p className="text-center text-xs text-foreground/40">
          カードを構成ボードへドラッグ＆ドロップ。同じカードを何度でも置けます（配置済みはタップで外す）。
        </p>

        <div className="sticky bottom-0 -mx-3 bg-gradient-to-t from-background via-background to-transparent px-3 pb-3 pt-6">
          <Controls />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div className="w-44 rotate-3">
            <ChordCardFace card={activeCard} songKey={session.key} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
