import { BlockWith, TestWith, use } from "../lib/withFixture";
import { Db } from "./withDb";

export type Server = { db: Db } | undefined;

export const withServer = (
  test: TestWith<{ db: Db }>,
  block: BlockWith<{ db: Db; server: Server }>
) => {
  test.describe("withServer", () => {
    let server: Server;
    test.beforeAll(({ db }) => {
      server = { db };
    });
    test.afterAll(() => {
      server = undefined;
    });
    use(test, () => ({ server }), block);
  });
};
