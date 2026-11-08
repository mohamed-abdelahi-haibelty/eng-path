import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readdirSync } from "node:fs";
import { requireSeedAdmin } from "../convex/lib/seedAuth";

test("maintenance access fails closed and accepts only the configured key", () => {
  const previous = process.env.SEED_ADMIN_KEY;
  try {
    delete process.env.SEED_ADMIN_KEY;
    assert.throws(() => requireSeedAdmin("a".repeat(64)), /Seed access denied/);
    process.env.SEED_ADMIN_KEY = "short";
    assert.throws(() => requireSeedAdmin("short"), /Seed access denied/);
    process.env.SEED_ADMIN_KEY = "a".repeat(64);
    assert.throws(() => requireSeedAdmin(undefined), /Seed access denied/);
    assert.throws(() => requireSeedAdmin("b".repeat(64)), /Seed access denied/);
    assert.doesNotThrow(() => requireSeedAdmin("a".repeat(64)));
  } finally {
    if (previous === undefined) delete process.env.SEED_ADMIN_KEY;
    else process.env.SEED_ADMIN_KEY = previous;
  }
});

test("every seed endpoint checks access before touching database or storage", async () => {
  const previous = process.env.SEED_ADMIN_KEY;
  delete process.env.SEED_ADMIN_KEY;
  let checked = 0;
  try {
    for (const name of readdirSync("convex/seed").filter((name) => name.endsWith(".ts"))) {
      const endpoints = await import(`../convex/seed/${name}`);
      for (const endpoint of Object.values(endpoints)) {
        const handler = (endpoint as { _handler?: (ctx: unknown, args: unknown) => unknown })._handler;
        if (!handler) continue;
        // Empty ctx deliberately has no database/storage: unauthenticated calls
        // must reject before reaching either capability, regardless of inputs.
        await assert.rejects(async () => handler({}, {}), /Seed access denied/);
        checked++;
      }
    }
    assert.ok(checked >= 14, `Expected all maintenance endpoints, checked ${checked}`);
  } finally {
    if (previous === undefined) delete process.env.SEED_ADMIN_KEY;
    else process.env.SEED_ADMIN_KEY = previous;
  }
});

test("authorized seed writes never persist the maintenance credential", async () => {
  const previous = process.env.SEED_ADMIN_KEY;
  process.env.SEED_ADMIN_KEY = "a".repeat(64);
  try {
    for (const name of ["reading", "writing", "speaking", "listening"]) {
      const endpoints = await import(`../convex/seed/${name}.ts`);
      let writes = 0;
      const ctx = {
        db: {
          insert: async (_table: string, data: Record<string, unknown>) => {
            assert.ok(!("seedAdminKey" in data));
            assert.equal(data.unitId, "synthetic-unit");
            writes++;
          },
        },
      };
      for (const endpoint of Object.values(endpoints)) {
        const handler = (endpoint as { _handler: (ctx: unknown, args: unknown) => unknown })._handler;
        await handler(ctx, { seedAdminKey: process.env.SEED_ADMIN_KEY, unitId: "synthetic-unit" });
      }
      assert.equal(writes, 1);
    }
  } finally {
    if (previous === undefined) delete process.env.SEED_ADMIN_KEY;
    else process.env.SEED_ADMIN_KEY = previous;
  }
});
