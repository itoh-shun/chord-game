"use client";

import { useGameStore, selectHand } from "@/store/gameStore";
import { structureSummary } from "@/lib/game";
import { ChordCardFace } from "@/components/ChordCardView";
import { describeKeyChange } from "@/lib/music";
import type { DrawnThemes } from "@/types";

const TYPE_LABEL: Record<string, string> = {
  structure: "こうせい変更",
  constraint: "コードの工夫",
  modulation: "転調(キー変え)",
  genre: "ジャンル寄せ",
};

const THEME_META: { key: keyof DrawnThemes; label: string; suffix?: string }[] =
  [
    { key: "genre", label: "ジャンル" },
    { key: "tempo", label: "テンポ", suffix: " BPM" },
    { key: "mood", label: "ムード" },
    { key: "situation", label: "シチュ" },
  ];

/** 順番に飛び出すアニメ用の style を作る */
function dealStyle(index: number, rot = 0): React.CSSProperties {
  return {
    animationDelay: `${index * 90}ms`,
    ["--deal-rot" as string]: `${rot}deg`,
  };
}

export function RevealScreen() {
  const session = useGameStore((s) => s.session);
  const setPhase = useGameStore((s) => s.setPhase);
  const reset = useGameStore((s) => s.reset);
  if (!session) return null;

  const hand = selectHand(session);
  const { customer, themes, special, structure } = session;
  const summary = structureSummary(session.board);

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 pb-28 pt-6">
      <p className="mb-1 text-center text-xs tracking-[0.3em] text-brass/70">
        PACK OPENED
      </p>
      <h2 className="mb-5 text-center text-xl font-black text-brass-bright">
        今日の作曲セット ✨
      </h2>

      {/* 客カード */}
      <div className="deal-in mb-3" style={dealStyle(0, -2)}>
        <div className="holo rounded-2xl bg-gradient-to-br from-amber-200 to-amber-400 p-[2px] shadow-xl">
          <div className="rounded-2xl bg-card p-4 text-card-ink">
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-700">
              客 / 依頼
            </span>
            <p className="mt-2 text-lg font-black">{customer.title}</p>
            <p className="mt-1 text-sm text-stone-600">{customer.description}</p>
          </div>
        </div>
      </div>

      {/* お題カード */}
      <div className="deal-in mb-3" style={dealStyle(1, 2)}>
        <div className="rounded-2xl bg-gradient-to-br from-sky-300 to-indigo-400 p-[2px] shadow-xl">
          <div className="rounded-2xl bg-card p-4 text-card-ink">
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-indigo-700">
              お題
            </span>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              {THEME_META.map(({ key, label, suffix }) => (
                <div
                  key={key}
                  className="rounded-lg bg-stone-100 px-3 py-2 ring-1 ring-stone-200"
                >
                  <dt className="text-[10px] text-stone-500">{label}</dt>
                  <dd className="text-base font-black text-stone-800">
                    {themes[key].value}
                    {suffix ?? ""}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* 店長カード (キラ) */}
      <div className="deal-in mb-5" style={dealStyle(2, -2)}>
        <div className="holo rounded-2xl bg-gradient-to-br from-rose-400 to-red-600 p-[2px] shadow-xl">
          <div className="rounded-2xl bg-card p-4 text-card-ink">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍶</span>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-rose-700">
                店長 / {TYPE_LABEL[special.type] ?? "イベント"}
              </span>
            </div>
            <p className="mt-2 text-lg font-black">{special.title}</p>
            <p className="mt-1 text-sm text-stone-600">{special.description}</p>
            <div className="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-sm text-stone-700">
              <span className="font-black text-rose-600">やり方 👉 </span>
              {special.hint}
              {special.type === "modulation" &&
                describeKeyChange(session.key, session.modulationSemitones) && (
                  <span className="mt-1 block font-black text-indigo-600">
                    今回は{" "}
                    {describeKeyChange(
                      session.key,
                      session.modulationSemitones,
                    )}
                  </span>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* 曲構成お題 */}
      <div className="deal-in mb-5" style={dealStyle(3, 2)}>
        <div className="rounded-2xl bg-gradient-to-br from-pop-lime to-pop-cyan p-[2px] shadow-xl">
          <div className="rounded-2xl bg-card p-4 text-card-ink">
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-black text-emerald-700">
              曲構成お題
            </span>
            <p className="mt-1.5 text-lg font-black">{structure.name}</p>
            <p className="mt-0.5 text-sm text-stone-600">
              {structure.description}
            </p>
            <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-stone-700">
              全{summary.totalBars}小節 ・ サビ{summary.chorusBars}小節
              {summary.hasPreChorus ? " ・ 前サビあり" : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {session.board.map((s, i) => (
                <span
                  key={s.id}
                  className="rounded-md bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-600"
                >
                  {i + 1}.{s.label}
                  <span className="text-stone-400">/{s.bars}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* コードカード */}
      <h3 className="mb-2 text-sm font-bold tracking-widest text-brass-bright">
        コードカード × {hand.length}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {hand.map((card, i) => (
          <div
            key={card.id}
            className="deal-in"
            style={dealStyle(4 + i, i % 2 ? 3 : -3)}
          >
            <ChordCardFace card={card} songKey={session.key} compact />
          </div>
        ))}
      </div>

      {/* 下部の固定 CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] gap-3 bg-gradient-to-t from-background via-background to-transparent px-4 pb-5 pt-8">
        <button
          type="button"
          onClick={reset}
          className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-foreground shadow ring-2 ring-pop-purple/40"
        >
          別のパック
        </button>
        <button
          type="button"
          onClick={() => setPhase("playing")}
          className="flex-1 rounded-2xl bg-gradient-to-r from-pop-yellow via-pop-pink to-pop-purple px-4 py-3 font-black text-white shadow-lg ring-2 ring-white/60 transition active:scale-95"
        >
          🎼 この素材で作曲する →
        </button>
      </div>
    </div>
  );
}
