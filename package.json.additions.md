# package.json additions for Phase A (task A0)

Add to "dependencies":
    "zod": "^3.23.0"

Add to "devDependencies":
    "vitest": "^2.1.0"

Add to "scripts":
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"

Note: "@types/pg" is already present in devDependencies.
