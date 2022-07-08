// Note: inspired by Playwright

import { afterAll, describe, expect, it } from "vitest";

type TODO = any;

type KeyValue = { [key: string]: any };
interface TestFunction<TestArgs> {
  (name: string, fn: (args: TestArgs) => Promise<void> | void): void;
}
interface HookFunction {
  (fn: () => void): void;
}
interface SuiteFunction {
  (name: string, fn: () => void): void;
}
interface TestType<TestArgs extends KeyValue> extends TestFunction<TestArgs> {
  afterAll: HookFunction;
  describe: SuiteFunction;
  extend<T extends KeyValue>(
    fixtures: Fixtures<T, TestArgs>
  ): TestType<TestArgs & T>;
}
type TestFixtureValue<R, Args extends KeyValue> = (
  args: Args,
  use: (r: R) => Promise<void> | void
) => any;
type Fixtures<T extends KeyValue, PT extends KeyValue> = {
  [K in keyof PT]?: TestFixtureValue<PT[K], T & PT>;
} & {
  [K in keyof T]?: TestFixtureValue<T[K], T & PT>;
};
type FixtureList<TestArgs> = [
  key: string,
  value: TestFixtureValue<any, TestArgs>
][];

class TestTypeImpl<TestArgs extends KeyValue> {
  readonly fixtures: Fixtures<TestArgs, TestArgs>;
  readonly test: TestType<TestArgs>;
  constructor(fixtures: Fixtures<{}, TestArgs>) {
    this.fixtures = fixtures;
    const test = (name: string, fn: (args: TestArgs) => void) =>
      it(name, async () => {
        const reduceFixtures = async (
          fixtureList: FixtureList<TestArgs>,
          args: TestArgs
        ): Promise<void> => {
          if (fixtureList.length === 0) {
            return fn(args);
          } else {
            const [[key, fixture], ...fixtureListRest] = fixtureList;
            // TODO: use cached worker-level fixture
            return fixture(args, async (value) => {
              const argsAccumulated = { ...args, [key]: value };
              return reduceFixtures(fixtureListRest, argsAccumulated);
            });
          }
        };
        const fixtureList = Object.entries(
          this.fixtures
        ) as FixtureList<TestArgs>;
        const args = {} as TestArgs;
        return reduceFixtures(fixtureList, args);
      });
    test.afterAll = afterAll;
    test.describe = (name: string, fn: () => void) => describe(name, fn);
    test.extend = <T>(
      fixtures: Fixtures<T, TestArgs>
    ): TestType<TestArgs & T> => {
      const fixturesExtended = { ...this.fixtures, ...fixtures } as Fixtures<
        T & TestArgs,
        T & TestArgs
      >;
      return new TestTypeImpl(fixturesExtended).test;
    };
    this.test = test;
  }
}

const rootTestType = new TestTypeImpl({});
const baseTest: TestType<{}> = rootTestType.test;
const test = baseTest;

let order: string[] = [];

type Db = { some: "db" };
const testWithDb = test.extend<{ db: Db }>({
  db: async ({}, use) => {
    order.push("setup db");
    let db: Db | undefined = { some: "db" };
    await use(db);
    order.push("teardown db");
    db = undefined;
  },
});

type Server = { db: Db };
const testWithServer = testWithDb.extend<{ server: Server }>({
  server: async ({ db }, use) => {
    order.push("setup server");
    let server: Server | undefined = { db };
    await use(server);
    order.push("teardown server");
    server = undefined;
  },
});

test.describe("testType", () => {
  testWithServer("should have setup db and server", ({ db, server }) => {
    order.push("test");
    expect(db).toEqual({ some: "db" });
    expect(server).toEqual({ db: { some: "db" } });
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
