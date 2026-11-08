import { strict as assert } from "node:assert";
import { test } from "node:test";
import { demoModuleAccess } from "../convex/lib/demoProgression";

function modules(french: boolean) {
  const keys = ["grammar", ...(french ? ["conjugaison", "orthographe"] : []), "reading", "listening", "writing", "speaking", "review"];
  return keys.map(key => ({ key, locked: key !== "grammar", lockedReason: "complete-previous", completed: false, score: undefined as number | undefined }));
}

test("demo guests can open every English and French module without completing exercises", () => {
  for (const french of [false, true]) {
    const input = modules(french);
    const result = demoModuleAccess(input, { isAnonymous: true }, true);
    assert.equal(result.length, french ? 8 : 6);
    assert.ok(result.every(entry => !entry.locked && entry.lockedReason === undefined));
    assert.ok(result.every(entry => !entry.completed && entry.score === undefined));
    assert.ok(input.find(entry => entry.key === "speaking")?.locked);
  }
});

test("normal accounts and disabled demos retain their prerequisite locks", () => {
  for (const french of [false, true]) {
    const input = modules(french);
    assert.strictEqual(demoModuleAccess(input, { isAnonymous: false }, true), input);
    assert.strictEqual(demoModuleAccess(input, {}, true), input);
    assert.strictEqual(demoModuleAccess(input, null, true), input);
    assert.strictEqual(demoModuleAccess(input, { isAnonymous: true }, false), input);
  }
});

test("demo navigation preserves earned scores and completion state", () => {
  const input = [{ key: "grammar", locked: false, completed: true, score: 85 }];
  assert.deepEqual(demoModuleAccess(input, { isAnonymous: true }, true), input);
});
