"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { ChordCard } from "@/types";
import { romanToChordName, romanToNotes, transposeKey } from "@/lib/music";
import { useGameStore } from "@/store/gameStore";
import { ChordDiagram } from "@/components/ChordDiagram";

const SECTION_LABEL: Record<ChordCard["section"], string> = {
  A: "Aメロ",
  B: "Bメロ",
  S: "サビ",
  C: "Cメロ",
};

// コード進行カード・ブック風の配色
const SECTION_COLOR: Record<ChordCard["section"], string> = {
  A: "bg-indigo-600",
  B: "bg-emerald-600",
  S: "bg-sky-500",
  C: "bg-orange-500",
};

const NAMED_PROGRESSIONS: Record<string, string> = {
  "IV V iii vi": "王道進行",
  "I V vi IV": "カノン系の定番",
  "vi IV I V": "エモい定番",
  "I vi IV V": "50s進行",
  "ii V I I": "ジャズ的ツーファイブ",
  "vi V IV V": "切なロック",
  "IV V I I": "明るく締める",
};

function cardNumber(id: string): string {
  const m = id.match(/_(\d+)$/);
  return m ? m[1] : "--";
}

function tagline(card: ChordCard): string {
  // 先頭4小節のパターンで通称を判定
  const named = NAMED_PROGRESSIONS[card.progression.slice(0, 4).join(" ")];
  if (named) return `${named}${card.bars <= 3 ? "(展開)" : ""}`;
  if (card.bars <= 3) return "短い展開フレーズ";
  return card.keyType === "minor" ? "切なめの進行" : "明るめの進行";
}

/** カードの中身: コード名 + ギターダイアグラム */
export function ChordContent({
  card,
  songKey,
  size = 1,
}: {
  card: ChordCard;
  songKey: string;
  size?: number;
}) {
  return (
    <div className="flex flex-wrap gap-x-1.5 gap-y-1">
      {card.progression.map((roman, i) => {
        const name = romanToChordName(roman, songKey);
        // 構成音(オクターブ番号を除いた音名)。運指が無いとき表示。
        const notes = romanToNotes(roman, songKey).map((n) =>
          n.replace(/\d+$/, ""),
        );
        return (
          <div key={i} className="flex flex-col items-center">
            <span className="text-[11px] font-black leading-none text-stone-800">
              {name}
            </span>
            <ChordDiagram chordName={name} size={size} fallbackNotes={notes} />
            <span className="text-[9px] leading-none text-stone-400">
              {roman}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** カードの見た目(本そっくりレイアウト) */
export function ChordCardFace({
  card,
  songKey,
  compact = false,
}: {
  card: ChordCard;
  songKey: string;
  compact?: boolean;
}) {
  const capo = useGameStore((s) => s.capo);
  // カポを付けると押さえるコード(フォーム)は capo 分だけ低いキーになる
  const shapeKey = capo > 0 ? transposeKey(songKey, -capo) : songKey;
  return (
    <div className="overflow-hidden rounded-lg bg-card text-card-ink shadow-md ring-1 ring-black/20">
      {/* 色タブ + 番号 */}
      <div
        className={`flex items-center justify-between px-2 py-1 text-white ${SECTION_COLOR[card.section]}`}
      >
        <span className="text-xs font-black tracking-wide">
          {SECTION_LABEL[card.section]}
        </span>
        <span className="rounded bg-white/25 px-1.5 text-[11px] font-black tabular-nums">
          {cardNumber(card.id)}
        </span>
      </div>
      <div className={compact ? "p-1.5" : "p-2"}>
        <div className="mb-1 flex items-center justify-between gap-1">
          <span className="truncate text-[10px] font-bold text-stone-500">
            {tagline(card)}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {capo > 0 && (
              <span className="rounded bg-orange-500 px-1 text-[9px] font-black text-white">
                Capo{capo}
              </span>
            )}
            <span className="rounded bg-stone-800 px-1 text-[9px] font-black text-white">
              Key={songKey}
            </span>
          </span>
        </div>
        <ChordContent card={card} songKey={shapeKey} size={compact ? 0.92 : 1} />
      </div>
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
      className="w-40 cursor-grab select-none active:cursor-grabbing"
    >
      <ChordCardFace card={card} songKey={songKey} />
    </div>
  );
}

export { SECTION_LABEL };
