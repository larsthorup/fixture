import { describe, expect, it } from "vitest";

// Note: inspired by Playwright
type KeyValue = { [key: string]: any };
interface TestFunction<TestArgs> {
  (name: string, testFunction: (args: TestArgs) => Promise<void> | void): void;
}
interface TestType<TestArgs extends KeyValue> extends TestFunction<TestArgs> {
  extend<T extends KeyValue>(fixtures: Fixtures<T>): TestType<T>;
}
type TestFixtureValue<R, Args extends KeyValue> = (
  args: Args,
  use: (r: R) => Promise<void> | void
) => any;
type Fixtures<T extends KeyValue> = {
  [K in keyof T]?: TestFixtureValue<T[K], T>;
};

// TODO: worker scope fixtures (aka beforeAll/afterAll)

const test: TestType<{}> = Object.assign(it, {
  extend: function extend<T extends KeyValue>(
    fixtures: Fixtures<T>
  ): TestType<T> {
    const baseTest = this as TestType<{}>;
    const extendedTest: TestType<T> = (name, fn) => {
      baseTest(name, async (args) => {
        const key = Object.keys(fixtures)[0]; // TODO: iterate over all fixtures
        const use = (arg: T) => fn({ ...args, [key]: arg } as T);
        await fixtures[key]!(args as T, use);
      });
    };
    extendedTest.extend = extend;
    return extendedTest;
  },
});

type Db = { some: "db" };
const testWithDb = test.extend<{ db: Db }>({
  db: async ({}, use) => {
    let db: Db | undefined = { some: "db" };
    await use(db);
    db = undefined;
  },
});
type Server = { db: Db };
const testWithServer = testWithDb.extend<
  { db: Db } & { server: Server } // TODO: {db: Db} should come implicitly with type of testWithDb
>({
  server: async ({ db }, use) => {
    let server: Server | undefined = { db };
    await use(server);
    server = undefined;
  },
});
describe("fixture.ts", () => {
  testWithServer("should have setup", ({ db, server }) => {
    expect(server).toEqual({ db: { some: "db" } });
    expect(db).toEqual({ some: "db" });
  });
});
