# Contributing

Keep the evidence layers separate. New fields need a threat-model entry, deterministic fixtures, and negative tests. Do not add claims of standard compatibility without an independent conformance test. Run `npm run lint`, `npm run test`, `npm run test:e2e`, `npm run build`, `npm run secret-scan`, and the Python vector suite before opening a change. Update the versioned schema and changelog when the evidence contract changes.
