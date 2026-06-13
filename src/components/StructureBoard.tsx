"use client";

import { useDroppable } from "@dnd-kit/core";
import type { BoardSlot } from "@/types";
import { useGameStore } from "@/store/gameStore";
import { ChordCardFace } from "@/components/ChordCardView";
import { transposeKey } from "@/lib/music";

function Slot({
  slot,
  index,
  isLastChorusZone,
}: {
  slot: BoardSlot;
  index: number;
  isLastChorusZone: boolean;
}) {
  const session = useGameStore((s) => s.session);
  const playingStep = useGameStore((s) => s.playingStep);
  const removeFromSlot = useGameStore((s) => s.removeFromSlot);
  const { setNodeRef, isOver, active } = useDroppable({
    id: slot.id,
    data: { slot },
  });

  if (!session) return null;
  const card = slot.cardId ? session.dealtCards[slot.cardId] : null;

  // ドラッグ中のカードがこのスロットに置けるか
  const draggingCard = active?.data.current?.card as
    | { section: BoardSlot["section"] }
    | undefined;
  const acceptable = draggingCard
    ? draggingCard.section === slot.section
    : true;

  const slotKey =
    isLastChorusZone && session.modulationSemitones !== 0
      ? transposeKey(session.key, session.modulationSemitones)
      : session.key;

  const isPlaying = playingStep === index;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={setNodeRef}
        className={`relative flex min-h-28 w-44 items-center justify-center rounded-2xl border-[3px] border-dashed p-1 transition-colors ${
          isOver && acceptable
            ? "border-pop-lime bg-pop-lime/20"
            : isOver && !acceptable
              ? "border-accent bg-accent/20"
              : "border-pop-purple/40 bg-white/50"
        } ${isPlaying ? "playing-glow" : ""}`}
      >
        {card ? (
          <button
            type="button"
            onClick={() => removeFromSlot(slot.id)}
            title="クリックで外す"
            className="w-full text-left"
          >
            <ChordCardFace card={card} songKey={slotKey} compact />
          </button>
        ) : (
          <div className="flex flex-col items-center text-pop-purple/45">
            <span className="text-xl font-black">{slot.label}</span>
            <span className="mt-0.5 text-[11px] font-bold">
              {slot.bars}小節
            </span>
          </div>
        )}
      </div>
      <span className="text-[11px] font-bold text-brass/80">
        {index + 1}. {slot.label}・{slot.bars}小節
      </span>
    </div>
  );
}

export function StructureBoard() {
  const session = useGameStore((s) => s.session);
  if (!session) return null;

  const lastChorusIndex = session.board
    .map((s) => s.section)
    .lastIndexOf("S");

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {session.board.map((slot, i) => (
        <Slot
          key={slot.id}
          slot={slot}
          index={i}
          isLastChorusZone={i >= lastChorusIndex}
        />
      ))}
    </div>
  );
}
