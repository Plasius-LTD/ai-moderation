# @plasius/ai-moderation

Forum, chat, profanity, and enforcement moderation contracts for Plasius AI governance.

## Scope

This package is part of the layered `@plasius/ai-*` package family. It is intentionally bootstrapped with a small public contract surface so implementation can evolve behind tracked Feature/Story/Task work.

## Install

```bash
npm install @plasius/ai-moderation
```

## Usage

```ts
import { packageDescriptor } from "@plasius/ai-moderation";

console.log(packageDescriptor.packageName);
```

## Development

```bash
npm install
npm run build
npm test
npm run test:coverage
npm run pack:check
```

## Release Workflow

Protected `main` releases use a two-step flow:

1. Run `.github/workflows/cd.yml` with `bump=patch|minor|major` to open or refresh a `release/vX.Y.Z` prep PR.
2. Merge that PR to `main`.
3. Rerun `.github/workflows/cd.yml` on `main` with `bump=none` to tag, draft the GitHub release, and publish to npm.

## Governance

- Security policy: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- ADRs: [docs/adrs](./docs/adrs)
- CLA and legal docs: [legal](./legal)

## License

Apache-2.0
