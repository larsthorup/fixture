# @larsthorup/fixture

Reusable fixtures for Vitest, inspired by Playwright and Pytest

```
npm install
npm test
```

## TODO

- test.use({schemaName: 'test'}) for input (like schemaName) - extractTable
- how to read other output (like databaseName)
- how to not produce output (like useTestKnex)
- only instantiate fixtures requested by a test (or auto):
  - playwright: innerFixtureParameterNames
