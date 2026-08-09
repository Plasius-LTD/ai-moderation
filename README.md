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
import {
  AI_MODERATION_FEATURE_FLAGS,
  resolveAiModerationDecision,
} from "@plasius/ai-moderation";

const result = resolveAiModerationDecision({
  text: "hello world",
  correlationId: "corr-123",
  channel: "chat",
  featureFlags: {
    [AI_MODERATION_FEATURE_FLAGS.moderation]: true,
  },
});

console.log(result.resolvedDecision);
```

## Moderation Validation

When moderation is enabled, malformed classifier findings fail closed instead of
returning `allow`. Unknown severities, non-finite `signalScore` values, or other
invalid finding payload fields return `moderation-invalid-finding` and resolve to:

- `human-review` when `ai.moderation.human-review.enabled` is on
- `escalate` otherwise

The original findings are preserved in the result for audit visibility.

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
<!-- BEGIN PLASIUS RELEASE INTEGRITY -->
## Release integrity

Production package publication runs only from `.github/workflows/cd.yml` on
protected `main`. The job verifies that the prepared commit is still the
current main commit and has an exact successful `ci.yml` push result before it
mutates release state. Public package CI runs on GitHub-hosted capacity so it
cannot execute on company-managed runners. npm publication runs on
GitHub-hosted Node.js 24 with
npm 11.5.1 or newer, uses the protected `production` environment and
short-lived npm OIDC with provenance, and has no long-lived npm write-token
fallback. Rollback disables CD; it never rewrites published package history.
<!-- END PLASIUS RELEASE INTEGRITY -->
