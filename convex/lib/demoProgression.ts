/** Unlock navigation for actual guest accounts; never mark exercises complete. */
export function demoModuleAccess<T extends { locked: boolean; lockedReason?: string }>(
  modules: T[],
  user: { isAnonymous?: boolean } | null,
  enabled: boolean,
): T[] {
  if (!enabled || user?.isAnonymous !== true) return modules;
  return modules.map((entry) => {
    const unlocked = { ...entry, locked: false };
    delete unlocked.lockedReason;
    return unlocked;
  });
}
