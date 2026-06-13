"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { ChordCard } from "@/types";
import { romanToChordName } from "@/lib/music";

const SECTION_LABEL: Record<ChordCard["section"], string> = {
  A: "Aメロ",
  B: "Bメロ",
  S: "サビ",
  C: "Cメロ",
};

const SECTION_COLOR: Record<ChordCard["section"], string> = {
  A: "bg-sky-700",
  B: "bg-violet-700",
  S: "bg-rose-600",
  C: "bg-emerald-700",
};

/** コードカードの中身(ローマ数字と解決後コード名) */
export function ChordContent({
  card,
  songKey,
}: {
  card: ChordCard;
  songKey: string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {card.progression.map((roman, i) => (
        <div
          key={i}
          className="flex min-w-12 flex-col items-center rounded bg-amber-100 px-1.5 py-1 ring-1 ring-amber-300"
        >
          <span className="text-[11px] font-semibold leading-none text-amber-800">
            {roman}
          </span>
          <span className="mt-0.5 text-sm font-bold leading-none text-stone-800">
            {romanToChordName(roman, songKey)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** カードの見た目(ドラッグ可否に依らない共通部分) */
export function ChordCardFace({
  card,
  songKey,
  compact = false,
}: {
  card: ChordCard;
  songKey: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-lg bg-card text-card-ink shadow-md ring-1 ring-black/20 ${
        compact ? "p-2" : "p-3"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`rounded px-2 py-0.5 text-xs font-bold text-white ${SECTION_COLOR[card.section]}`}
        >
          {SECTION_LABEL[card.section]}
        </span>
        <span className="text-[10px] text-stone-500">{card.bars}小節</span>
      </div>
      <ChordContent card={card} songKey={songKey} />
    </div>
  );
}

/** 手札用のドラッグ可能なコードカード */
export function DraggableChordCard({
  card,
  songKey,
}: {
  card: ChordCard;
  songKey: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: card.id, data: { card } });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    touchAction: "none" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="w-44 cursor-grab active:cursor-grabbing select-none"
    >
      <ChordCardFace card={card} songKey={songKey} />
    </div>
  );
}

export { SECTION_LABEL };
