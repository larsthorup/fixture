import { BlockWith, TestWith, use } from "../../lib/withFixture";

export type Db = { some: string } | undefined;

export const withDb = (test: TestWith<{}>, block: BlockWith<{ db: Db }>) => {
  test.describe(withDb.name, () => {
    let db: Db;
    test.beforeAll(() => {
      db = { some: "db" };
    });
    test.afterAll(() => {
      db = undefined;
    });
    use(test, () => ({ db }), block);
  });
};
