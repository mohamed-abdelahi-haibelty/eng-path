import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

type UnitBySlug = NonNullable<
  FunctionReturnType<typeof api.queries.unit.unitBySlug>
>;

export type UnitModule = UnitBySlug["modules"][number];
export type ModuleKey = UnitModule["key"];
export type Language = "en" | "fr";

export const EN_MODULES = [
  "grammar",
  "reading",
  "listening",
  "writing",
  "speaking",
  "review",
] as const satisfies readonly ModuleKey[];

export const FR_MODULES = [
  "grammar",
  "conjugaison",
  "orthographe",
  "reading",
  "listening",
  "writing",
  "speaking",
  "review",
] as const satisfies readonly ModuleKey[];

export function getModulesForLanguage(language: Language): readonly ModuleKey[] {
  return language === "fr" ? FR_MODULES : EN_MODULES;
}

/**
 * The URL segment used for a given module. The route folders in
 * `app/[locale]/(learning)/.../[unit]/<segment>/page.tsx` match these.
 */
export function moduleSegment(key: ModuleKey): string {
  return key;
}

export function moduleHref(
  locale: string,
  level: string,
  unitSlug: string,
  key: ModuleKey,
): string {
  return `/${locale}/levels/${level}/${unitSlug}/${moduleSegment(key)}`;
}

/**
 * Returns the next module in sequence for a given language,
 * or null if `current` is the last one.
 */
export function nextModule(
  language: Language,
  current: ModuleKey,
): ModuleKey | null {
  const seq = getModulesForLanguage(language);
  const idx = seq.indexOf(current);
  if (idx === -1 || idx === seq.length - 1) return null;
  return seq[idx + 1];
}
