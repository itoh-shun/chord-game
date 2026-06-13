"use client";

import type { Section } from "@/types";
import { useSongStore } from "@/store/songStore";
import { PROGRESSION_PRESETS } from "@/lib/song";
import { ChordCellView, SECTION_STYLE } from "@/components/ChordCellView";

export function SectionLane({
  section,
  songKey,
  activeCellId,
}: {
  section: Section;
  songKey: string;
  activeCellId: string | null;
}) {
  const renameSection = useSongStore((s) => s.renameSection);
  const removeSection = useSongStore((s) => s.removeSection);
  const applyPreset = useSongStore((s) => s.applyPreset);
  const addChord = useSongStore((s) => s.addChord);
  const setEditing = useSongStore((s) => s.setEditing);
  const st = SECTION_STYLE[section.color] ?? SECTION_STYLE.sky;

  return (
    <section className={`rounded-2xl ${st.soft} p-2 ring-2 ${st.ring}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-4 w-1.5 rounded-full ${st.bar}`} />
        <input
          value={section.name}
          onChange={(e) => renameSection(section.id, e.target.value)}
          className="w-24 bg-transparent text-sm font-black text-stone-700 outline-none"
        />
        <select
          value=""
          onChange={(e) => {
            if (e.target.value !== "") applyPreset(section.id, Number(e.target.value));
          }}
          className="ml-auto rounded-lg bg-white px-2 py-1 text-xs font-bold text-stone-600 ring-1 ring-stone-200"
        >
          <option value="">定番を流し込む</option>
          {PROGRESSION_PRESETS.map((p, i) => (
            <option key={p.name} value={i}>
              {p.name}（{p.hint}）
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => removeSection(section.id)}
          className="rounded-lg bg-white px-2 py-1 text-xs font-black text-stone-400 ring-1 ring-stone-200"
        >
          ✕
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {section.chords.map((c) => (
          <ChordCellView
            key={c.id}
            cell={c}
            songKey={songKey}
            color={section.color}
            active={c.id === activeCellId}
            onTap={() => setEditing({ sectionId: section.id, chordId: c.id })}
          />
        ))}
        <button
          type="button"
          onClick={() => addChord(section.id)}
          className="flex w-[44px] shrink-0 items-center justify-center rounded-xl bg-white text-2xl font-black text-stone-300 ring-2 ring-dashed ring-stone-300 active:scale-95"
        >
          ＋
        </button>
      </div>
    </section>
  );
}
