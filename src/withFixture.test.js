// @ts-nocheck // TODO

import * as test from "vitest";

// withSetup - use describe to model a composable fixture
// TODO: async
const use = (test, get, block) => {
  block({
    ...test,
    beforeAll: (fn) => {
      test.beforeAll(() => {
        fn({ ...test, ...get() });
      });
    },
    it: (name, fn) => {
      test.it(name, (test) => {
        fn({ ...test, ...get() });
      });
    },
  });
};
const withSetup = (name, setup) => {
  return (test, block) => {
    test.describe(`withSetup(${name})`, () => {
      setup({ ...test, use: (get) => use(test, get, block) });
    });
  };
};
test.describe("withSetup", () => {
  let order = [];
  test.describe("block", () => {
    const withDb = withSetup("db", (test) => {
      let db;
      test.beforeAll(() => {
        db = { some: "db" };
        order.push("setup db");
      });
      test.afterAll(() => {
        db = undefined;
        order.push("teardown db");
      });
      test.use(() => ({ db }));
    });
    const withServer = withSetup("server", ({ beforeAll, afterAll, use }) => {
      let server;
      beforeAll(({ db }) => {
        server = { db };
        order.push("setup server");
      });
      afterAll(() => {
        server = undefined;
        order.push("teardown server");
      });
      use(() => ({ server }));
    });
    const withInfra = (test, block) => {
      withDb(test, (test) => {
        withServer(test, (test) => {
          use(test, () => ({}), block);
        });
      });
    };
    withInfra(test, (test) => {
      test.it("should have setup", ({ db, server }) => {
        test.expect(server).toEqual({ db: { some: "db" } });
        test.expect(db).toEqual({ some: "db" });
        order.push("test");
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
