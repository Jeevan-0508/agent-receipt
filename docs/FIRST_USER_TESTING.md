# First-user testing guide

This is a 10–15 minute local beta exercise for a developer who has not seen the repository.

1. Follow [`GETTING_STARTED.md`](GETTING_STARTED.md) through the MCP demo.
2. Run `npm run test:packages` and note the tarball paths are temporary.
3. Open the workbench with `npm run web:dev` and select all seven scenarios.
4. Confirm that the valid scenario is `VERIFIED`, the missing-evidence scenario is `INDETERMINATE`, and boundary violations are `FAILED`.
5. Change one action parameter in a generated package and confirm the CLI does not report `VERIFIED`.

Please record operating system, Node version, commands used, first confusing step, and the exact error output. Do not include private keys or sensitive action payloads in an issue. Use the repository's Developer feedback issue form for usability feedback and the security policy for suspected vulnerabilities.
