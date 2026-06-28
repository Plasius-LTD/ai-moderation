# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - Moderation now fails closed for malformed classifier findings instead of returning `allow` or `moderation-pass`.

## [0.1.6] - 2026-06-28

- **Added**
  - (placeholder)

- **Changed**
  - Refreshed development dependency baselines to `@types/node@26.0.1`, `@typescript-eslint/*@8.62.0`, `eslint@10.6.0`, `globals@17.7.0`, and `vitest@4.1.9`.

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.5] - 2026-06-22

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.4] - 2026-06-22

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.3] - 2026-05-20

- **Added**
  - Added moderation decision outcomes, finding models, and redaction/escation policy resolution helpers.

- **Changed**
  - Added feature-flag-gated moderation decision contracts with audit metadata and human-review escalation paths.

- **Fixed**
  - Release automation now prepares version/changelog updates on a release PR before publishing from protected `main`.
  - (placeholder)

- **Security**
  - Redaction requests now escalate without returning transformed text when the redaction flag is disabled.

## [0.1.2] - 2026-05-13

- **Added**
  - (placeholder)

- **Changed**
  - Refreshed dependencies to the latest stable published versions.
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.1] - 2026-05-13

- Added initial public package scaffold with governance, legal, docs, build, test, and pack-check baselines.


[0.1.1]: https://github.com/Plasius-LTD/ai-moderation/releases/tag/v0.1.1
[0.1.2]: https://github.com/Plasius-LTD/ai-moderation/releases/tag/v0.1.2
[0.1.3]: https://github.com/Plasius-LTD/ai-moderation/releases/tag/v0.1.3
[0.1.4]: https://github.com/Plasius-LTD/ai-moderation/releases/tag/v0.1.4
[0.1.5]: https://github.com/Plasius-LTD/ai-moderation/releases/tag/v0.1.5
[0.1.6]: https://github.com/Plasius-LTD/ai-moderation/releases/tag/v0.1.6
