// 作曲酒場 - 型定義

export type Section = "A" | "B" | "S" | "C";

/** 客カード: 楽曲依頼内容 */
export type CustomerCard = {
  id: string;
  title: string;
  description: string;
};

export type ThemeCategory = "genre" | "tempo" | "mood" | "situation";

/** お題カード: 楽曲条件 */
export type ThemeCard = {
  id: string;
  category: ThemeCategory;
  value: string;
};

/** 引かれたお題一式 */
export type DrawnThemes = {
  genre: ThemeCard;
  tempo: ThemeCard;
  mood: ThemeCard;
  situation: ThemeCard;
};

/** コードカード: 楽曲パーツ */
export type ChordCard = {
  id: string;
  name: string;
  section: Section;
  keyType: "major" | "minor";
  bars: number;
  progression: string[];
};

export type SpecialType = "structure" | "constraint" | "modulation" | "genre";

/** 店長カード: イベントカード */
export type SpecialCard = {
  id: string;
  title: string;
  description: string;
  /** 具体的なやり方・例（初心者向け） */
  hint: string;
  type: SpecialType;
};

/** 曲構成ボードの1スロット */
export type BoardSlot = {
  id: string;
  section: Section;
  /** 配置されたコードカードのID（未配置はnull） */
  cardId: string | null;
};
