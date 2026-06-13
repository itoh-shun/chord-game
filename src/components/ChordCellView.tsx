"use client";

import type { ChordCell } from "@/types";
import { cellChordName } from "@/lib/music";
import { ChordDiagram } from "@/components/ChordDiagram";

export const SECTION_STYLE: Record<
  string,
  { bar: string; ring: string; soft: string }
> = {
  sky: { bar: "bg-sky-500", ring: "ring-sky-400", soft: "bg-sky-50" },
  violet: { bar: "bg-violet-500", ring: "ring-violet-400", soft: "bg-violet-50" },
  rose: { bar: "bg-rose-500", ring: "ring-rose-400", soft: "bg-rose-50" },
  emerald: { bar: "bg-emerald-500", ring: "ring-emerald-400", soft: "bg-emerald-50" },
  amber: { bar: "bg-amber-500", ring: "ring-amber-400", soft: "bg-amber-50" },
  cyan: { bar: "bg-cyan-500", ring: "ring-cyan-400", soft: "bg-cyan-50" },
};

export function ChordCellView({
  cell,
  songKey,
  color,
  active,
  onTap,
}: {
  cell: ChordCell;
  songKey: string;
  color: string;
  active?: boolean;
  onTap?: () => void;
}) {
  const name = cellChordName(cell, songKey);
  const st = SECTION_STYLE[color] ?? SECTION_STYLE.sky;
  return (
    <button
      type="button"
      onClick={onTap}
      className={`relative flex w-[76px] shrink-0 flex-col items-center overflow-hidden rounded-xl bg-white shadow ring-2 transition active:scale-95 ${
        active ? "ring-pop-yellow scale-105 playing-glow" : st.ring
      }`}
    >
      <span className={`h-1.5 w-full ${st.bar}`} />
      <span className="mt-1 text-sm font-black leading-none text-stone-800">
        {name}
      </span>
      <ChordDiagram chordName={name} size={0.82} />
      <span className="mb-1 rounded-full bg-stone-100 px-1.5 text-[9px] font-bold text-stone-500">
        {cell.beats}拍
      </span>
    </button>
  );
}
