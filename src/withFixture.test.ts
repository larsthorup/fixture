import { afterAll, beforeAll, describe, expect, it } from "vitest";

type AfterAll<T extends {}> = (fn: (test: T) => void) => void;
type BeforeAll<T extends {}> = (fn: (test: T) => void) => void;
type Describe<T extends {}> = (name: string, fn: (test: T) => void) => void;
type It<T extends {}> = (name: string, fn: (test: T) => void) => void;
type Test<T extends {}> = {
  afterAll: AfterAll<T>;
  beforeAll: BeforeAll<T>;
  describe: Describe<T>;
  it: It<T>;
};
type Block<T extends {}> = (test: Test<T>) => void;

const test = {
  afterAll,
  beforeAll,
  describe,
  it,
};

test.describe("withFixture, typed", () => {
  let order: string[] = [];

  test.describe("block", () => {
    type Db = { some: string };
    const withDb = (test: Test<{}>, block: Block<{ db: Db | undefined }>) => {
      let db: Db | undefined;
      const get = () => ({ db });
      test.beforeAll(() => {
        db = { some: "db" };
        order.push("setup db");
      });
      test.afterAll(() => {
        db = undefined;
        order.push("teardown db");
      });
      block({
        ...test,
        afterAll: (fn: (test: { db: Db | undefined }) => void) => {
          test.afterAll(() => {
            fn({ ...test, ...get() });
          });
        },
        beforeAll: (fn: (test: { db: Db | undefined }) => void) => {
          test.beforeAll(() => {
            fn({ ...test, ...get() });
          });
        },
        describe: (
          name: string,
          fn: (test: { db: Db | undefined }) => void
        ) => {
          test.describe(name, (test: {}) => {
            fn({ ...test, ...get() });
          });
        },
        it: (name: string, fn: (test: { db: Db | undefined }) => void) => {
          test.it(name, (test: {}) => {
            fn({ ...test, ...get() });
          });
        },
      });
    };
    withDb(test, (test) => {
      test.describe("withServer", () => {
        type Server = { db: Db | undefined };
        let server: Server | undefined;
        test.beforeAll(({ db }) => {
          server = { db };
          order.push("setup server");
        });
        test.afterAll(() => {
          server = undefined;
          order.push("teardown server");
        });
        test.it("should have setup", ({ db }) => {
          expect(server).toEqual({ db: { some: "db" } });
          expect(db).toEqual({ some: "db" });
          order.push("test");
        });
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
