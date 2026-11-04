import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "../src/lib/password.ts";

test("password hashing uses a random salt and verifies without trimming", async () => {
  const password = " Eine lange Passphrase! ";
  const first = await hashPassword(password);
  assert.notEqual(first, await hashPassword(password));
  assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword(password.trim(), first), false);
  assert.equal(await verifyPassword("falsch", first), false);
});
test("unknown accounts and malformed hashes cannot authenticate", async () => {
  assert.equal(await verifyPassword("test", null), false);
  assert.equal(await verifyPassword("test", "invalid"), false);
});
