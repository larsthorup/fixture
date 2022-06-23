import * as test from "vitest";

test.describe("withFixture, typed", () => {
  let order: string[] = [];

  test.describe("block", () => {
    test.describe("withDb", () => {
      type Db = { some: string };
      let db: Db | undefined;
      test.beforeAll(() => {
        db = { some: "db" };
        order.push("setup db");
      });
      test.afterAll(() => {
        db = undefined;
        order.push("teardown db");
      });
      test.describe("withServer", () => {
        type Server = { db: Db | undefined };
        let server: Server | undefined;
        test.beforeAll(() => {
          server = { db };
          order.push("setup server");
        });
        test.afterAll(() => {
          server = undefined;
          order.push("teardown server");
        });
        test.it("should have setup", () => {
          test.expect(server).toEqual({ db: { some: "db" } });
          test.expect(db).toEqual({ some: "db" });
          order.push("test");
        });
      });
    });
  });

  test.afterAll(() => {
    test
      .expect(order)
      .toEqual([
        "setup db",
        "setup server",
        "test",
        "teardown server",
        "teardown db",
      ]);
  });
});
