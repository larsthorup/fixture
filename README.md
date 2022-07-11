# @larsthorup/fixture

Reusable fixtures for Vitest, inspired by Playwright and Pytest

```
npm install
npm test
```

- how to pass input to test scoped fixtures: use a generator function
- how to read other output (like databaseName): return an array or object
- how to not produce output (like useTestKnex): return undefined: void
- how to mix and match independent fixtures adhoc

## publish

- with eslint, types (also published, badge on npm), tests, coverage
- PR for extract-pg-schema
- badges: npm, build, coverage
- with docs
- announce
  - discord:vitest
  - twitter

## TODO

- remove use
- find a less stateful API instead of `workerTest.use({setting: ''})`
- fix: link to deps fixtures, do not copy fixtures, for parent.use to work
- only instantiate fixtures requested by a test (or auto):
  - playwright: innerFixtureParameterNames
