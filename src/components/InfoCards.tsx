"use client";

import type { CustomerCard, DrawnThemes, SpecialCard } from "@/types";

function Panel({
  title,
  children,
  accent = "brass",
}: {
  title: string;
  children: React.ReactNode;
  accent?: "brass" | "accent";
}) {
  const ring = accent === "accent" ? "ring-accent/60" : "ring-brass/50";
  const head = accent === "accent" ? "text-accent" : "text-brass-bright";
  return (
    <section
      className={`rounded-xl bg-wood-dark/80 p-4 shadow-lg ring-1 ${ring}`}
    >
      <h2
        className={`mb-2 text-sm font-bold uppercase tracking-widest ${head}`}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CustomerCardView({ customer }: { customer: CustomerCard }) {
  return (
    <Panel title="客 / 依頼">
      <p className="text-lg font-bold text-foreground">{customer.title}</p>
      <p className="mt-1 text-sm text-foreground/70">{customer.description}</p>
    </Panel>
  );
}

const THEME_META: { key: keyof DrawnThemes; label: string; suffix?: string }[] =
  [
    { key: "genre", label: "ジャンル" },
    { key: "tempo", label: "テンポ", suffix: " BPM" },
    { key: "mood", label: "ムード" },
    { key: "situation", label: "シチュ" },
  ];

export function ThemeCardsView({ themes }: { themes: DrawnThemes }) {
  return (
    <Panel title="お題">
      <dl className="grid grid-cols-2 gap-2">
        {THEME_META.map(({ key, label, suffix }) => (
          <div
            key={key}
            className="rounded-lg bg-black/30 px-3 py-2 ring-1 ring-brass/20"
          >
            <dt className="text-[11px] text-brass/70">{label}</dt>
            <dd className="text-base font-bold text-foreground">
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
  structure: "構成変更",
  constraint: "コード制約",
  modulation: "転調",
  genre: "ジャンル変更",
};

export function SpecialCardView({ special }: { special: SpecialCard }) {
  return (
    <Panel title="店長の無茶振り" accent="accent">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          🍶
        </span>
        <div>
          <span className="inline-block rounded bg-accent/30 px-2 py-0.5 text-[11px] font-bold text-accent">
            {TYPE_LABEL[special.type]}
          </span>
          <p className="mt-1 text-lg font-bold text-foreground">
            {special.title}
          </p>
          <p className="mt-1 text-sm italic text-foreground/70">
            「{special.description}」
          </p>
        </div>
      </div>
    </Panel>
  );
}
