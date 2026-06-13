"use client";

import type { CustomerCard, DrawnThemes, SpecialCard } from "@/types";
import { describeKeyChange } from "@/lib/music";

function Panel({
  title,
  emoji,
  children,
  tone = "violet",
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
  tone?: "violet" | "pink" | "cyan";
}) {
  const ring =
    tone === "pink"
      ? "ring-pop-pink/60"
      : tone === "cyan"
        ? "ring-pop-cyan/60"
        : "ring-pop-purple/50";
  const head =
    tone === "pink"
      ? "text-accent"
      : tone === "cyan"
        ? "text-pop-cyan"
        : "text-brass";
  return (
    <section
      className={`rounded-2xl bg-wood-dark/90 p-4 shadow-[0_6px_0_rgba(0,0,0,0.06)] ring-2 ${ring}`}
    >
      <h2
        className={`mb-2 flex items-center gap-1.5 text-sm font-black tracking-wide ${head}`}
      >
        <span>{emoji}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CustomerCardView({ customer }: { customer: CustomerCard }) {
  return (
    <Panel title="きゃく / 依頼" emoji="🧑‍🎤" tone="cyan">
      <p className="text-lg font-black text-foreground">{customer.title}</p>
      <p className="mt-1 text-sm text-foreground/70">{customer.description}</p>
    </Panel>
  );
}

const THEME_META: {
  key: keyof DrawnThemes;
  label: string;
  suffix?: string;
  chip: string;
}[] = [
  { key: "genre", label: "ジャンル", suffix: "", chip: "bg-pop-cyan/20" },
  { key: "tempo", label: "テンポ", suffix: " BPM", chip: "bg-pop-yellow/30" },
  { key: "mood", label: "ムード", suffix: "", chip: "bg-pop-pink/20" },
  { key: "situation", label: "シチュ", suffix: "", chip: "bg-pop-lime/25" },
];

export function ThemeCardsView({ themes }: { themes: DrawnThemes }) {
  return (
    <Panel title="お題" emoji="🎯" tone="violet">
      <dl className="grid grid-cols-2 gap-2">
        {THEME_META.map(({ key, label, suffix, chip }) => (
          <div key={key} className={`rounded-xl ${chip} px-3 py-2`}>
            <dt className="text-[11px] font-bold text-foreground/50">{label}</dt>
            <dd className="text-base font-black text-foreground">
              {themes[key].value}
              {suffix ?? ""}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

const TYPE_LABEL: Record<SpecialCard["type"], string> = {
  structure: "こうせい変更",
  constraint: "コードの工夫",
  modulation: "転調(キー変え)",
  genre: "ジャンル寄せ",
};

export function SpecialCardView({
  special,
  songKey,
  modulationSemitones = 0,
}: {
  special: SpecialCard;
  songKey?: string;
  modulationSemitones?: number;
}) {
  const concrete =
    special.type === "modulation" && songKey
      ? describeKeyChange(songKey, modulationSemitones)
      : null;
  return (
    <Panel title="店長カード" emoji="🍶" tone="pink">
      <span className="inline-block rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-black text-accent">
        {TYPE_LABEL[special.type]}
      </span>
      <p className="mt-1.5 text-lg font-black text-foreground">
        {special.title}
      </p>
      <p className="mt-1 text-sm text-foreground/75">{special.description}</p>
      <div className="mt-2 rounded-xl bg-pop-yellow/20 px-3 py-2 text-sm text-foreground/80">
        <span className="font-black text-accent">やり方 👉 </span>
        {special.hint}
        {concrete && (
          <span className="mt-1 block font-black text-brass">
            今回は {concrete}
          </span>
        )}
      </div>
    </Panel>
  );
}
