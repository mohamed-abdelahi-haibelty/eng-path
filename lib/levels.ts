export const VALID_LEVELS = ["a1", "a2", "b1", "b2"] as const;

export type LevelParam = (typeof VALID_LEVELS)[number];
export type CefrCode = "A1" | "A2" | "B1" | "B2";

export interface LevelMeta {
  param: LevelParam;
  cefrCode: CefrCode;
  name: string;
  description: string;
  href: string;
}

export const LEVELS: Record<LevelParam, LevelMeta> = {
  a1: {
    param: "a1",
    cefrCode: "A1",
    name: "Beginner",
    description:
      "Build a foundation with everyday vocabulary, simple sentence structures, and basic conversational patterns.",
    href: "/levels/a1",
  },
  a2: {
    param: "a2",
    cefrCode: "A2",
    name: "Elementary",
    description:
      "Expand into routine topics, past and future tenses, and short connected texts on familiar subjects.",
    href: "/levels/a2",
  },
  b1: {
    param: "b1",
    cefrCode: "B1",
    name: "Intermediate",
    description:
      "Express opinions, handle most situations you might encounter while travelling, and write coherent texts.",
    href: "/levels/b1",
  },
  b2: {
    param: "b2",
    cefrCode: "B2",
    name: "Upper-Intermediate",
    description:
      "Engage with complex texts, argue a position fluently, and demonstrate the proficiency TOEFL requires.",
    href: "/levels/b2",
  },
};

export const LEVEL_LIST: readonly LevelMeta[] = VALID_LEVELS.map((p) => LEVELS[p]);

export function isValidLevel(value: string): value is LevelParam {
  return (VALID_LEVELS as readonly string[]).includes(value);
}

export function getLevelMeta(raw: string): LevelMeta | null {
  const param = raw.toLowerCase();
  return isValidLevel(param) ? LEVELS[param] : null;
}
