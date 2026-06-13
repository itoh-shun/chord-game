// お題チャレンジ: お題生成と採点

import type { Song } from "@/types";
import { songToEvents } from "@/lib/song";
import { cellToRoman } from "@/lib/music";

export type Rule = {
  id: string;
  label: string;
  /** 満たしているか */
  check: (song: Song) => boolean;
};

export type Brief = {
  customer: string;
  genre: string;
  mood: string;
  rules: Rule[];
};

const CUSTOMERS = [
  "新人VTuberのデビュー曲",
  "アニメ最終回のエンディング",
  "夏フェスのアンセム",
  "深夜の作業用BGM",
  "告白前夜のラブソング",
  "ラスボス戦のテーマ",
  "学園祭ライブの締め",
  "朝の情報番組のジングル",
];
const GENRES = ["アニソン", "J-POP", "ロック", "シティポップ", "バラード", "EDM"];
const MOODS = ["明るい", "切ない", "エモい", "おしゃれ", "激しい"];

function uniqueChords(song: Song): number {
  const s = new Set<string>();
  for (const sec of song.sections)
    for (const c of sec.chords) s.add(cellToRoman(c));
  return s.size;
}
function allCells(song: Song) {
  return song.sections.flatMap((s) => s.chords);
}

const RULE_POOL: Rule[] = [
  { id: "sabi", label: "サビを入れる", check: (s) => s.sections.some((x) => x.name.includes("サビ")) },
  { id: "two", label: "展開を2つ以上作る", check: (s) => s.sections.length >= 2 },
  { id: "variety", label: "コードを5種類以上使う", check: (s) => uniqueChords(s) >= 5 },
  {
    id: "seventh",
    label: "おしゃれコード(7th系)を1つ以上",
    check: (s) =>
      allCells(s).some((c) => ["7", "maj7", "m7", "6", "add9"].includes(c.quality)),
  },
  {
    id: "minor",
    label: "マイナーコードを使う",
    check: (s) => allCells(s).some((c) => c.quality === "m" || c.quality === "dim"),
  },
  {
    id: "tonic",
    label: "最後はトニック(I)で終える",
    check: (s) => {
      const ev = songToEvents(s);
      const last = ev[ev.length - 1];
      return !!last && /^I(?![IV])/.test(last.roman);
    },
  },
  {
    id: "long",
    label: "8拍以上のセクションを作る",
    check: (s) =>
      s.sections.some((x) => x.chords.reduce((n, c) => n + c.beats, 0) >= 8),
  },
];

function pick<T>(arr: T[], seed: () => number): T {
  return arr[Math.floor(seed() * arr.length)];
}

/** seed があれば日替わり等で固定。なければランダム */
function rng(seed?: number): () => number {
  if (seed === undefined) return Math.random;
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function generateBrief(seed?: number): Brief {
  const r = rng(seed);
  const mood = pick(MOODS, r);
  // ムードに応じて必須ルールを足す
  const moodRule =
    mood === "切ない"
      ? RULE_POOL.find((x) => x.id === "minor")!
      : mood === "おしゃれ"
        ? RULE_POOL.find((x) => x.id === "seventh")!
        : RULE_POOL.find((x) => x.id === "sabi")!;
  const others = RULE_POOL.filter((x) => x.id !== moodRule.id);
  // シャッフルして2つ
  const shuffled = [...others].sort(() => r() - 0.5).slice(0, 2);
  return {
    customer: pick(CUSTOMERS, r),
    genre: pick(GENRES, r),
    mood,
    rules: [moodRule, ...shuffled],
  };
}

export type ScoreLine = { label: string; got: number; max: number };
export type Result = {
  total: number;
  stars: number;
  lines: ScoreLine[];
  comment: string;
  coins: number;
};

export function scoreSong(song: Song, brief: Brief): Result {
  const cells = allCells(song);
  const ev = songToEvents(song);
  const lines: ScoreLine[] = [];

  // 1. お題ルール (40)
  const ruleEach = 40 / brief.rules.length;
  let ruleGot = 0;
  for (const rule of brief.rules) if (rule.check(song)) ruleGot += ruleEach;
  lines.push({ label: "お題クリア", got: Math.round(ruleGot), max: 40 });

  // 2. コード多様性 (20)
  const uniq = uniqueChords(song);
  lines.push({ label: "コードの彩り", got: Math.min(20, uniq * 4), max: 20 });

  // 3. 終止感 (15)
  const last = ev[ev.length - 1];
  const endsTonic = !!last && /^I(?![IV])/.test(last.roman);
  lines.push({ label: "まとまり(終止)", got: endsTonic ? 15 : 5, max: 15 });

  // 4. 展開 (10)
  lines.push({
    label: "展開の豊かさ",
    got: Math.min(10, song.sections.length * 5),
    max: 10,
  });

  // 5. ムード一致 (15)
  const minorCount = cells.filter(
    (c) => c.quality === "m" || c.quality === "m7" || c.quality === "dim",
  ).length;
  const ratio = cells.length ? minorCount / cells.length : 0;
  let moodGot = 8;
  if (brief.mood === "切ない" || brief.mood === "エモい") moodGot = ratio >= 0.3 ? 15 : 7;
  else if (brief.mood === "明るい" || brief.mood === "激しい") moodGot = ratio <= 0.4 ? 15 : 7;
  else moodGot = 12; // おしゃれ等はゆるめ
  lines.push({ label: "ムード一致", got: moodGot, max: 15 });

  const total = Math.min(100, lines.reduce((n, l) => n + l.got, 0));
  const stars = total >= 85 ? 3 : total >= 60 ? 2 : 1;
  const coins = Math.round(total / 2) + stars * 10;

  // 一番低い項目からアドバイス
  const worst = [...lines].sort((a, b) => a.got / a.max - b.got / b.max)[0];
  const advice: Record<string, string> = {
    "お題クリア": "お題の条件をもう少し満たしてみよう。",
    "コードの彩り": "違うコードを増やすと表情が出るよ。",
    "まとまり(終止)": "最後をI(トニック)にすると締まるよ。",
    "展開の豊かさ": "セクション(展開)を足すと曲らしくなる。",
    "ムード一致": `${brief.mood}な雰囲気に寄せてみよう。`,
  };
  const comment =
    stars === 3
      ? "完璧だ！お客さん大満足！🎉"
      : stars === 2
        ? `いい感じ！あと一歩 — ${advice[worst.label]}`
        : `まずは合格！ — ${advice[worst.label]}`;

  return { total, stars, lines, comment, coins };
}
