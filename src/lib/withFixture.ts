import { afterAll, beforeAll, describe, expect, it } from "vitest";

export type TestWith<T extends {}> = {
  afterAll: (fn: (test: TestWith<T>) => void) => void;
  beforeAll: (fn: (test: TestWith<T>) => void) => void;
  describe: (name: string, fn: (test: TestWith<T>) => void) => void;
  it: (name: string, fn: (test: TestWith<T>) => void) => void;
} & T;
export type BlockWith<T extends {}> = (test: TestWith<T>) => void;

export const test: TestWith<{}> = {
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

export const use = <T extends {}, U extends {}>(
  test: TestWith<T>,
  get: () => U,
  block: BlockWith<T & U>
) => {
  block({
    ...test,
    ...get(),
    afterAll: (fn: BlockWith<T & U>) => {
      test.afterAll((test: TestWith<T>) => {
        fn({ ...test, ...get() } as TestWith<T & U>);
      });
    },
    beforeAll: (fn: BlockWith<T & U>) => {
      test.beforeAll((test: TestWith<T>) => {
        fn({ ...test, ...get() } as TestWith<T & U>);
      });
    },
    describe: (name: string, fn: BlockWith<T & U>) => {
      test.describe(name, (test: TestWith<T>) => {
        fn({ ...test, ...get() } as TestWith<T & U>);
      });
    },
    it: (name: string, fn: BlockWith<T & U>) => {
      test.it(name, (test: TestWith<T>) => {
        fn({ ...test, ...get() } as TestWith<T & U>);
      });
    },
  });
};
