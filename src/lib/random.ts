// ランダム抽選ユーティリティ

/** 配列から1つランダムに選ぶ */
export function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 配列からn個ランダムに選ぶ(重複あり) */
export function pickMany<T>(arr: readonly T[], n: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(pickOne(arr));
  return out;
}

/** 配列をシャッフルした新しい配列を返す (Fisher-Yates) */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 衝突しにくい簡易ID生成 */
export function genId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
