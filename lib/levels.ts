export const VALID_LEVELS = ["a1", "a2", "b1", "b2"] as const;

export type LevelParam = (typeof VALID_LEVELS)[number];
export type CefrCode = "A1" | "A2" | "B1" | "B2";

export interface LevelMeta {
  param: LevelParam;
  cefrCode: CefrCode;
}

const META: Record<LevelParam, LevelMeta> = {
  a1: { param: "a1", cefrCode: "A1" },
  a2: { param: "a2", cefrCode: "A2" },
  b1: { param: "b1", cefrCode: "B1" },
  b2: { param: "b2", cefrCode: "B2" },
};

export const LEVEL_LIST: readonly LevelMeta[] = VALID_LEVELS.map((p) => META[p]);

export function isValidLevel(value: string): value is LevelParam {
  return (VALID_LEVELS as readonly string[]).includes(value);
}

export function getLevelMeta(raw: string): LevelMeta | null {
  const param = raw.toLowerCase();
  return isValidLevel(param) ? META[param] : null;
}

export function levelHref(locale: string, param: LevelParam): string {
  return `/${locale}/levels/${param}`;
}
