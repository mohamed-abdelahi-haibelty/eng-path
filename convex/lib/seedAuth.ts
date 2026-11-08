import { ConvexError } from "convex/values";

/** Maintenance functions stay disabled unless a private admin key is configured. */
export function requireSeedAdmin(provided: string | undefined) {
  const expected = process.env.SEED_ADMIN_KEY;
  if (!expected || expected.length < 32 || !provided || provided !== expected) {
    throw new ConvexError("Seed access denied.");
  }
}
