import { test as base } from "../../lib/fixture";

export type Db = { some: "db" };
export const test = base.extend<{ db: Db }>({
  db: async ({}, use) => {
    const db: Db = { some: "db" };
    await use(db);
  },
});
