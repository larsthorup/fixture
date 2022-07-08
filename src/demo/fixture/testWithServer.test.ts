import { expect } from "vitest";
import { test } from "./testWithServer";

test.describe("testWithServer", () => {
  test("should have setup", ({ db, server }) => {
    expect(server).toEqual({ db: { some: "db" } });
    expect(db).toEqual({ some: "db" });
  });
});
