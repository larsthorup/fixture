import { BlockWith, TestWith, use } from "../../lib/withFixture";
import { Db, withDb } from "./withDb";
import { Server, withServer } from "./withServer";

export const withInfra = (
  test: TestWith<{}>,
  block: BlockWith<{ db: Db; server: Server }>
) => {
  withDb(test, (test) => {
    withServer(test, (test) => {
      use(test, () => ({}), block);
    });
  });
};
