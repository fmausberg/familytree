import assert from "node:assert/strict";
import { test } from "node:test";

test("hot reload replaces a cached Prisma client without the authAttempt model", async () => {
  const staleClient = {};
  globalThis.prisma = staleClient;
  const { prisma } = await import("../src/lib/prisma.ts");
  try {
    assert.notEqual(prisma, staleClient);
    assert.equal(typeof prisma.authAttempt.upsert, "function");
    assert.equal(globalThis.prisma, prisma);
  } finally {
    await prisma.$disconnect();
    delete globalThis.prisma;
  }
});
