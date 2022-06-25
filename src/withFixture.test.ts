import * as test from "vitest";

type AfterAll<T extends {}> = (fn: (test: T) => void) => void;
type BeforeAll<T extends {}> = (fn: (test: T) => void) => void;
type Describe<T extends {}> = (name: string, fn: (test: T) => void) => void;
type It<T extends {}> = (name: string, fn: (test: T) => void) => void;

const { expect } = test;

test.describe("withFixture, typed", () => {
  let order: string[] = [];

  test.describe("block", () => {
    type Db = { some: string };
    const withDb = (
      test: {
        afterAll: AfterAll<{}>;
        beforeAll: BeforeAll<{}>;
        describe: Describe<{}>;
        it: It<{}>;
      },
      block: (test: {
        afterAll: AfterAll<{ db: Db | undefined }>;
        beforeAll: BeforeAll<{ db: Db | undefined }>;
        describe: Describe<{ db: Db | undefined }>;
        it: It<{ db: Db | undefined }>;
      }) => void
    ) => {
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
