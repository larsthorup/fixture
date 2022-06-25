import { afterAll, beforeAll, describe, expect, it } from "vitest";

type TestWith<T extends {}> = {
  afterAll: (fn: (test: TestWith<T>) => void) => void;
  beforeAll: (fn: (test: TestWith<T>) => void) => void;
  describe: (name: string, fn: (test: TestWith<T>) => void) => void;
  it: (name: string, fn: (test: TestWith<T>) => void) => void;
} & T;
type BlockWith<T extends {}> = (test: TestWith<T>) => void;

const test: TestWith<{}> = {
  afterAll: (fn: BlockWith<{}>) => {
    afterAll(() => fn(test));
  },
  beforeAll: (fn: BlockWith<{}>) => {
    beforeAll(() => fn(test));
  },
  describe: (name: string, fn: BlockWith<{}>) => {
    describe(name, () => fn(test));
  },
  it: (name: string, fn: BlockWith<{}>) => {
    it(name, () => fn(test));
  },
};

const use = <T extends {}, U extends {}>(
  test: TestWith<T>,
  get: () => U,
  block: BlockWith<U>
) => {
  block({
    ...test,
    ...get(),
    afterAll: (fn: BlockWith<U>) => {
      test.afterAll((test: TestWith<T>) => {
        fn({ ...test, ...get() } as TestWith<T & U>);
      });
    },
    beforeAll: (fn: BlockWith<U>) => {
      test.beforeAll((test: TestWith<T>) => {
        fn({ ...test, ...get() } as TestWith<T & U>);
      });
    },
    describe: (name: string, fn: BlockWith<U>) => {
      test.describe(name, (test: TestWith<T>) => {
        fn({ ...test, ...get() } as TestWith<T & U>);
      });
    },
    it: (name: string, fn: BlockWith<U>) => {
      test.it(name, (test: TestWith<T>) => {
        fn({ ...test, ...get() } as TestWith<T & U>);
      });
    },
  });
};

test.describe("withFixture, typed", () => {
  let order: string[] = [];

  test.describe("block", () => {
    type Db = { some: string } | undefined;
    const withDb = (test: TestWith<{}>, block: BlockWith<{ db: Db }>) => {
      test.describe("useDb", () => {
        let db: Db;
        const get = () => ({ db });
        test.beforeAll(() => {
          db = { some: "db" };
          order.push("setup db");
        });
        test.afterAll(() => {
          db = undefined;
          order.push("teardown db");
        });
        use(test, get, block);
      });
    };
    withDb(test, (test) => {
      test.describe("withServer", () => {
        type Server = { db: Db };
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
