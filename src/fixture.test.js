import { describe, expect, it } from "vitest";

function extend(fixtures) {
  const baseTest = this;
  const extendedTest = (name, fn) => {
    baseTest(name, async (args) => {
      const key = Object.keys(fixtures)[0]; // TODO: iterate over all fixtures
      const use = (arg) => fn({ ...args, [key]: arg });
      await fixtures[key](args, use);
    });
  };
  extendedTest.extend = extend;
  return extendedTest;
}
// TODO: worker scope fixtures (aka beforeAll/afterAll)

const test = it;
test.extend = extend;

// type Db = { some: 'db' };
const testwithDb = test.extend({
  db: async ({}, use) => {
    let db = { some: "db" };
    await use(db);
    db = undefined;
  },
});
// type Server = { db: Db };
const testWithServer = testwithDb.extend({
  server: async ({ db }, use) => {
    let server = { db };
    await use(server);
    server = undefined;
  },
});
describe("fixture", () => {
  testWithServer("should have setup", ({ db, server }) => {
    expect(server).toEqual({ db: { some: "db" } });
    expect(db).toEqual({ some: "db" });
  });
});
