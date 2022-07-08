// Note: inspired by Playwright

import { expect } from "vitest";
import { test } from "./lib/fixture";

let order: string[] = [];

type Db = { some: "db" };
const testWithDb = test.extend<{ db: Db }>({
  db: [
    async ({}, use) => {
      order.push("setup db");
      let db: Db | undefined = { some: "db" };
      await use(db, async () => {
        // console.log("teardown db");
        order.push("teardown db");
        db = undefined;
      });
    },
    { scope: "worker" },
  ],
});

type Server = { db: Db };
const testWithServer = testWithDb.extend<{ server: Server }>({
  server: async ({ db }, use) => {
    order.push("setup server");
    let server: Server | undefined = { db };
    await use(server, async () => {
      order.push("teardown server");
      server = undefined;
    });
  },
});

test.describe("fixture", () => {
  test.describe("scope to postpone afterAll until db teardown", () => {
    testWithServer("should have setup db and server", ({ db, server }) => {
      order.push("test");
      expect(db).toEqual({ some: "db" });
      expect(server).toEqual({ db: { some: "db" } });
    });
    testWithServer(
      "should have setup db once and server twice",
      ({ db, server }) => {
        order.push("test");
        expect(db).toEqual({ some: "db" });
        expect(server).toEqual({ db: { some: "db" } });
      }
    );
  });
  test.afterAll(async () => {
    expect(order).toEqual([
      "setup db",
      "setup server",
      "test",
      "teardown server",
      "setup server",
      "test",
      "teardown server",
      "teardown db",
    ]);
  });
});
