"use client";

import { useEffect, useState } from "react";
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
  const newGame = useGameStore((s) => s.newGame);
  const placeCard = useGameStore((s) => s.placeCard);
  const [activeCard, setActiveCard] = useState<ChordCard | null>(null);

  // 乱数を使うためクライアントマウント後に初期セッションを生成
  useEffect(() => {
    if (!useGameStore.getState().session) newGame();
  }, [newGame]);

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
      <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-black tracking-wide text-brass-bright drop-shadow">
            🍻 作曲酒場
            <span className="ml-2 text-base font-normal text-foreground/50">
              （仮）
            </span>
          </h1>
          <Controls />
        </header>

        <div className="grid gap-4 lg:grid-cols-3">
          <CustomerCardView customer={session.customer} />
          <ThemeCardsView themes={session.themes} />
          <SpecialCardView special={session.special} />
        </div>

        <section className="rounded-xl bg-wood-dark/60 p-4 shadow-inner ring-1 ring-brass/30">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-brass-bright">
              曲構成ボード
            </h2>
            <span className="text-xs text-brass/70">
              Key = {session.key}
              {session.modulationSemitones !== 0 &&
                `（ラストサビで転調）`}
            </span>
          </div>
          <StructureBoard />
        </section>

        <Hand />

        <footer className="pt-2 text-center text-xs text-foreground/40">
          手札カードを構成ボードのスロットへドラッグ＆ドロップ。配置済みカードはクリックで手札に戻ります。
        </footer>
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
