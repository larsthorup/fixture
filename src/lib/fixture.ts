import { beforeAll, it } from "vitest";

type KeyValue = { [key: string]: any };
interface TestFunction<TestArgs> {
  (name: string, fn: (args: TestArgs) => Promise<void> | void): void;
}
export interface TestType<
  TestArgs extends KeyValue,
  WorkerArgs extends KeyValue
> extends TestFunction<TestArgs & WorkerArgs> {
  use(fixtures: Fixtures<{}, {}, TestArgs, WorkerArgs>): void;
  extend<T extends KeyValue, W extends KeyValue = {}>(
    fixtures: Fixtures<T, W, TestArgs, WorkerArgs>
  ): TestType<TestArgs & T, WorkerArgs & W>;
}
type TestFixture<R, Args extends KeyValue> = (
  args: Args,
  use: (r: R, teardown?: () => Promise<void>) => Promise<void> | void
) => any;
export type WorkerFixture<R, Args extends KeyValue> = (
  args: Args,
  use: (r: R, teardown?: () => Promise<void>) => Promise<void>
) => any;
type TestFixtureValue<R, Args extends KeyValue> =
  | Exclude<R, Function>
  | TestFixture<R, Args>;
type WorkerFixtureValue<R, Args extends KeyValue> =
  | Exclude<R, Function>
  | WorkerFixture<R, Args>;

type Fixtures<
  T extends KeyValue,
  W extends KeyValue,
  PT extends KeyValue,
  PW extends KeyValue
> = {
  [K in keyof PT]?: TestFixtureValue<PT[K], T & PT & PW>;
} & {
  [K in keyof T]?:
    | TestFixtureValue<T[K], T & PT & PW>
    | [TestFixtureValue<T[K], T & PT & PW>, { scope?: "test" }];
} & {
  [K in keyof PW]?: WorkerFixtureValue<PW[K], W & PW>;
} & {
  [K in keyof W]?: [WorkerFixtureValue<W[K], W & PW>, { scope: "worker" }];
};
type FixtureScope = "test" | "worker";
type FixtureOptions = { scope: FixtureScope };
type FixtureValue<TestArgs, WorkerArgs> =
  | TestFixtureValue<any, TestArgs>
  | [TestFixtureValue<any, TestArgs>, FixtureOptions]
  | [WorkerFixtureValue<any, WorkerArgs>, FixtureOptions];

type FixtureList<TestArgs, WorkerArgs> = [
  key: string,
  value: FixtureValue<TestArgs, WorkerArgs>
][];

const allTests: TestTypeImpl<KeyValue, KeyValue>[] = [];

let workerHookSingleton: typeof workerHook;
const workerHook = async (): Promise<() => Promise<void>> => {
  const teardownList: (() => Promise<void>)[] = [];
  const reduceFixtures = async (
    fixtureList: FixtureList<KeyValue, KeyValue>,
    args: KeyValue
  ): Promise<void> => {
    if (fixtureList.length > 0) {
      const [[key, fixture], ...fixtureListRest] = fixtureList;
      const [fixtureValueOrFunction, { scope }] = Array.isArray(fixture)
        ? fixture
        : [fixture, { scope: "test" as FixtureScope }];
      const fixtureFunction: TestFixture<any, KeyValue> =
        typeof fixtureValueOrFunction === "function"
          ? fixtureValueOrFunction
          : (_: KeyValue, use: (value: any) => Promise<void>) =>
              use(fixtureValueOrFunction);
      switch (scope) {
        case "test":
          fixtureValueCache[key] = undefined;
          return;
        case "worker":
          return fixtureFunction(args, async (value, teardown) => {
            fixtureValueCache[key] = value;
            const argsAccumulated = { ...args, [key]: value };
            if (teardown) teardownList.push(teardown);
            return reduceFixtures(fixtureListRest, argsAccumulated);
          });
      }
    }
  };
  const allFixtures = {};
  for (const test of allTests) {
    Object.assign(allFixtures, test.fixtures);
  }
  const fixtureList = Object.entries(allFixtures) as FixtureList<
    KeyValue,
    KeyValue
  >;
  const args = {} as KeyValue;
  await reduceFixtures(fixtureList, args);
  return async () => {
    for (const teardown of teardownList.reverse()) {
      await teardown();
    }
  };
};

const fixtureValueCache: { [key: string]: any } = {};
class TestTypeImpl<TestArgs extends KeyValue, WorkerArgs extends KeyValue> {
  readonly fixtures: Fixtures<TestArgs, WorkerArgs, TestArgs, WorkerArgs>;
  readonly test: TestType<TestArgs, WorkerArgs>;
  constructor(fixtures: Fixtures<{}, {}, TestArgs, WorkerArgs>) {
    this.fixtures = fixtures;
    allTests.push(this);
    const test = (name: string, fn: (args: TestArgs & WorkerArgs) => void) => {
      if (!workerHookSingleton) {
        // Note: ensure that we only generate a single beforeAll for the worker
        workerHookSingleton = workerHook;
        beforeAll(workerHookSingleton);
      }
      it(name, async () => {
        const reduceFixtures = async (
          fixtureList: FixtureList<TestArgs, WorkerArgs>,
          args: TestArgs & WorkerArgs
        ): Promise<void> => {
          if (fixtureList.length === 0) {
            return fn(args);
          } else {
            const [[key, fixture], ...fixtureListRest] = fixtureList;
            const [fixtureValueOrFunction, { scope }] = Array.isArray(fixture)
              ? fixture
              : [fixture, { scope: "test" as FixtureScope }];
            const fixtureFunction: TestFixture<any, KeyValue> =
              typeof fixtureValueOrFunction === "function"
                ? fixtureValueOrFunction
                : (_: KeyValue, use: (value: any) => Promise<void>) =>
                    use(fixtureValueOrFunction);
            switch (scope) {
              case "test":
                return fixtureFunction(args, async (value, teardown) => {
                  const argsAccumulated = { ...args, [key]: value };
                  await reduceFixtures(fixtureListRest, argsAccumulated);
                  if (teardown) await teardown();
                });
              case "worker":
                // TODO: merge with above
                const value = fixtureValueCache[key];
                const argsAccumulated = { ...args, [key]: value };
                return reduceFixtures(fixtureListRest, argsAccumulated);
            }
          }
        };
        const fixtureList = Object.entries(this.fixtures) as FixtureList<
          TestArgs,
          WorkerArgs
        >;
        const args = {} as TestArgs & WorkerArgs;
        return reduceFixtures(fixtureList, args);
      });
    };
    test.extend = <T, W>(
      fixtures: Fixtures<
        T & TestArgs,
        W & WorkerArgs,
        T & TestArgs,
        W & WorkerArgs
      >
    ): TestType<TestArgs & T, WorkerArgs & W> => {
      // TODO: do not copy parent fixture, but link to parent to support parent.use() changing the fixture
      const fixturesExtended = { ...this.fixtures, ...fixtures } as Fixtures<
        T & TestArgs,
        W & WorkerArgs,
        T & TestArgs,
        W & WorkerArgs
      >;
      return new TestTypeImpl(fixturesExtended).test;
    };
    test.use = (fixtures: Fixtures<{}, {}, TestArgs, WorkerArgs>) => {
      for (const [key, fixture] of Object.entries(fixtures)) {
        const fixtureBase = this.fixtures[key] as FixtureValue<
          TestArgs,
          WorkerArgs
        >;
        const isWorker = Array.isArray(fixtureBase)
          ? (fixtureBase[1] as FixtureOptions).scope === "worker"
          : false;
        Object.assign(this.fixtures, {
          [key]:
            isWorker && !Array.isArray(fixture)
              ? [fixture, { scope: "worker" }]
              : fixture,
        });
      }
    };
    this.test = test as TestType<TestArgs, WorkerArgs>;
  }
}

const rootTestType = new TestTypeImpl({});
const baseTest: TestType<{}, {}> = rootTestType.test;
export const test = baseTest;
