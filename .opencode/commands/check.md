---
description: Run full verification: lint → typecheck → test
---

Run all three verification steps sequentially and report results:

```bash
bun run lint && tsc -b && bun run test
```

If any step fails, stop and report the failure. Do NOT modify code unless all three pass.
If all three pass, report success.
