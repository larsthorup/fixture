import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
} from "vitest";

export type TestFn<T extends {}> = (test: TestWith<T>) => void | Promise<void>;
export type Hook<T extends {}> = (fn: TestFn<T>, timeout?: number) => void;
export type TestWith<T extends {}> = {
  afterAll: Hook<T>;
  afterEach: Hook<T>;
  beforeAll: Hook<T>;
  beforeEach: Hook<T>;
  describe: (name: string, fn: (test: TestWith<T>) => void) => void;
  it: (name: string, fn: TestFn<T>, timeout?: number) => void;
} & T;
export type BlockWith<T extends {}> = (test: TestWith<T>) => void;

export const test: TestWith<{}> = {
  afterAll: (fn: BlockWith<{}>, timeout: number | undefined = undefined) => {
    afterAll(() => fn(test), timeout);
  },
  afterEach: (fn: BlockWith<{}>, timeout: number | undefined = undefined) => {
    afterEach(() => fn(test), timeout);
  },
  beforeAll: (fn: BlockWith<{}>, timeout: number | undefined = undefined) => {
    beforeAll(() => fn(test), timeout);
  },
  beforeEach: (fn: BlockWith<{}>, timeout: number | undefined = undefined) => {
    beforeEach(() => fn(test), timeout);
  },
  describe: (name: string, fn: BlockWith<{}>) => {
    describe(name, () => fn(test));
  },
  it: (
    name: string,
    fn: BlockWith<{}>,
    timeout: number | undefined = undefined
  ) => {
    it(name, () => fn(test), timeout);
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
    afterAll: (
      fn: BlockWith<T & U>,
      timeout: number | undefined = undefined
    ) => {
      test.afterAll(
        (test: TestWith<T>) => fn({ ...test, ...get() } as TestWith<T & U>),
        timeout
      );
    },
    afterEach: (
      fn: BlockWith<T & U>,
      timeout: number | undefined = undefined
    ) => {
      test.afterEach(
        (test: TestWith<T>) => fn({ ...test, ...get() } as TestWith<T & U>),
        timeout
      );
    },
    beforeAll: (
      fn: BlockWith<T & U>,
      timeout: number | undefined = undefined
    ) => {
      test.beforeAll(
        (test: TestWith<T>) => fn({ ...test, ...get() } as TestWith<T & U>),
        timeout
      );
    },
    beforeEach: (
      fn: BlockWith<T & U>,
      timeout: number | undefined = undefined
    ) => {
      test.beforeEach(
        (test: TestWith<T>) => fn({ ...test, ...get() } as TestWith<T & U>),
        timeout
      );
    },
    describe: (name: string, fn: BlockWith<T & U>) => {
      test.describe(name, (test: TestWith<T>) => {
        fn({ ...test, ...get() } as TestWith<T & U>);
      });
    },
    it: (
      name: string,
      fn: BlockWith<T & U>,
      timeout: number | undefined = undefined
    ) => {
      test.it(
        name,
        (test: TestWith<T>) => fn({ ...test, ...get() } as TestWith<T & U>),
        timeout
      );
    },
  });
};
