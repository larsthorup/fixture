// Note: inspired by Playwright

import { expect } from "vitest";
import { test } from "./lib/fixture";

let order: string[] = [];

type Db = { name: string };
const testWithDb = test.extend<{}, { name: string; db: Db }>({
  name: ["test", { scope: "worker" }],
  db: [
    async ({ name }, use) => {
      order.push("setup db");
      let db: Db | undefined = { name };
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

testWithServer.use({ name: "db" });
test.describe("fixture", () => {
  test.describe("scope to postpone afterAll until db teardown", () => {
    testWithServer("should have setup db and server", ({ db, server }) => {
      order.push("test");
      expect(db).toEqual({ name: "db" });
      expect(server).toEqual({ db: { name: "db" } });
    });
    testWithServer(
      "should have setup db once and server twice",
      ({ db, server }) => {
        order.push("test");
        expect(db).toEqual({ name: "db" });
        expect(server).toEqual({ db: { name: "db" } });
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
