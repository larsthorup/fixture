import { expect } from "vitest";
import { BlockWith, test, TestWith, use } from "./lib/withFixture";

// TODO: withSetup

test.describe("withFixture, typed", () => {
  let order: string[] = [];

  test.describe("block", () => {
    type Db = { some: string } | undefined;
    const withDb = (test: TestWith<{}>, block: BlockWith<{ db: Db }>) => {
      test.describe("useDb", () => {
        let db: Db;
        test.beforeAll(async () => {
          db = { some: "db" };
          order.push("setup db");
          await new Promise((resolve) => setTimeout(resolve, 500));
        }, 1000);
        test.afterAll(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          db = undefined;
          order.push("teardown db");
        });
        use(test, () => ({ db }), block);
      });
    };
    type Server = { db: Db } | undefined;
    const withServer = (
      test: TestWith<{ db: Db }>,
      block: BlockWith<{ db: Db; server: Server }>
    ) => {
      test.describe("withServer", () => {
        let server: Server;
        test.beforeEach(async ({ db }) => {
          server = { db };
          order.push("setup server");
          await new Promise((resolve) => setTimeout(resolve, 300));
        });
        test.afterEach(async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          server = undefined;
          order.push("teardown server");
        });
        use(test, () => ({ server }), block);
      });
    };
    const withInfra = (
      test: TestWith<{}>,
      block: BlockWith<{ db: Db; server: Server }>
    ) => {
      withDb(test, (test) => {
        withServer(test, (test) => {
          use(test, () => ({}), block);
        });
      });
    };
    withInfra(test, (test) => {
      test.it("should have setup", ({ db, server }) => {
        expect(server).toEqual({ db: { some: "db" } });
        expect(db).toEqual({ some: "db" });
        expect(db);
        order.push("test");
      });
    });
  });

  test.afterAll(() => {
    expect(order).toEqual([
      "setup db",
      "setup server",
      "test",
      "teardown server",
      "teardown db",
    ]);
  });
});
