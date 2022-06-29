import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "vitest";

export type TestWith<T extends {}> = {
  afterAll: (fn: (test: TestWith<T>) => void | Promise<void>) => void;
  afterEach: (fn: (test: TestWith<T>) => void | Promise<void>) => void;
  beforeAll: (fn: (test: TestWith<T>) => void | Promise<void>) => void;
  beforeEach: (fn: (test: TestWith<T>) => void | Promise<void>) => void;
  describe: (name: string, fn: (test: TestWith<T>) => void) => void;
  it: (name: string, fn: (test: TestWith<T>) => void | Promise<void>) => void;
} & T;
export type BlockWith<T extends {}> = (test: TestWith<T>) => void;

export const test: TestWith<{}> = {
  afterAll: (fn: BlockWith<{}>) => {
    afterAll(() => fn(test));
  },
  afterEach: (fn: BlockWith<{}>) => {
    afterEach(() => fn(test));
  },
  beforeAll: (fn: BlockWith<{}>) => {
    beforeAll(() => fn(test));
  },
  beforeEach: (fn: BlockWith<{}>) => {
    beforeEach(() => fn(test));
  },
  describe: (name: string, fn: BlockWith<{}>) => {
    describe(name, () => fn(test));
  },
  it: (name: string, fn: BlockWith<{}>) => {
    it(name, () => fn(test));
  },
};

export const use = <T extends {}, U extends {}>(
  test: TestWith<T>,
  get: () => U,
  block: BlockWith<T & U>
) => {
  block({
    ...test,
    ...get(),
    afterAll: (fn: BlockWith<T & U>) => {
      test.afterAll((test: TestWith<T>) =>
        fn({ ...test, ...get() } as TestWith<T & U>)
      );
    },
    afterEach: (fn: BlockWith<T & U>) => {
      test.afterEach((test: TestWith<T>) =>
        fn({ ...test, ...get() } as TestWith<T & U>)
      );
    },
    beforeAll: (fn: BlockWith<T & U>) => {
      test.beforeAll((test: TestWith<T>) =>
        fn({ ...test, ...get() } as TestWith<T & U>)
      );
    },
    beforeEach: (fn: BlockWith<T & U>) => {
      test.beforeEach((test: TestWith<T>) =>
        fn({ ...test, ...get() } as TestWith<T & U>)
      );
    },
    describe: (name: string, fn: BlockWith<T & U>) => {
      test.describe(name, (test: TestWith<T>) => {
        fn({ ...test, ...get() } as TestWith<T & U>);
      });
    },
    it: (name: string, fn: BlockWith<T & U>) => {
      test.it(name, (test: TestWith<T>) =>
        fn({ ...test, ...get() } as TestWith<T & U>)
      );
    },
  });
};
