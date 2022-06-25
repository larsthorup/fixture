import { expect } from "vitest";
import { test } from "../lib/withFixture";
import { withInfra } from "./withInfra";

withInfra(test, (test) => {
  test.it("should have setup", ({ db, server }) => {
    expect(server).toEqual({ db: { some: "db" } });
    expect(db).toEqual({ some: "db" });
  });
});
