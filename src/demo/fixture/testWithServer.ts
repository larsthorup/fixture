import { test as base, Db } from "./testWithDb";

export type Server = { db: Db };
export const test = base.extend<{ server: Server }>({
  server: async ({ db }, use) => {
    const server = { db };
    await use(server);
  },
});
