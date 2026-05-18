import { describe, expect, it } from "vitest";

import {
  AI_MODERATION_FEATURE_FLAGS,
  AI_MODERATION_FEATURE_FLAG_ID,
  AI_MODERATION_PACKAGE,
  AI_MODERATION_SEVERITIES,
  AI_MODERATION_DECISIONS,
  AI_MODERATION_CHANNELS,
  resolveAiModerationDecision,
  packageDescriptor,
} from "../src/index.js";

describe("@plasius/ai-moderation", () => {
  it("exports the package descriptor contract", () => {
    expect(packageDescriptor.packageName).toBe(AI_MODERATION_PACKAGE);
    expect(packageDescriptor.featureFlagId).toBe(AI_MODERATION_FEATURE_FLAG_ID);
    expect(packageDescriptor.summary.length).toBeGreaterThan(0);
  });

  it("declares moderation feature flags", () => {
    expect(AI_MODERATION_FEATURE_FLAGS).toEqual({
      moderation: AI_MODERATION_FEATURE_FLAG_ID,
      humanReview: "ai.moderation.human-review.enabled",
      redaction: "ai.moderation.redaction.enabled",
    });
  });

  it("declares supported decisions, severities, and channels", () => {
    expect(AI_MODERATION_DECISIONS).toEqual([
      "allow",
      "warn",
      "redact",
      "block",
      "quarantine",
      "escalate",
      "human-review",
    ]);
    expect(AI_MODERATION_SEVERITIES).toEqual([
      "low",
      "medium",
      "high",
      "critical",
    ]);
    expect(AI_MODERATION_CHANNELS).toEqual(["chat", "forum", "dm", "ugc"]);
  });

  it("falls back to allow when moderation flag is disabled", () => {
    expect(
      resolveAiModerationDecision({
        text: "hello world",
        correlationId: "corr-allow",
        channel: "chat",
      })
    ).toMatchObject({
      requestedDecision: "allow",
      resolvedDecision: "allow",
      reasonCodes: ["ai-moderation-disabled-fallback-allow"],
      requiresHumanReview: false,
      enabledFeatureFlags: [],
    });
  });

  it("escalates critical findings when human review is enabled", () => {
    expect(
      resolveAiModerationDecision({
        text: "hate message",
        correlationId: "corr-critical",
        channel: "forum",
        requestedDecision: "block",
        featureFlags: {
          [AI_MODERATION_FEATURE_FLAGS.moderation]: true,
          [AI_MODERATION_FEATURE_FLAGS.humanReview]: true,
          [AI_MODERATION_FEATURE_FLAGS.redaction]: true,
        },
        findings: [
          {
            code: "toxic-content",
            message: "Explicit harassment",
            severity: "critical",
            signalScore: 0.97,
          },
        ],
      })
    ).toMatchObject({
      resolvedDecision: "human-review",
      reasonCodes: ["critical-finding-escalated"],
      requiresHumanReview: true,
      findings: expect.any(Array),
    });
  });

  it("applies redaction when requested and redaction enabled", () => {
    expect(
      resolveAiModerationDecision({
        text: "username: Zephod",
        correlationId: "corr-redact",
        channel: "dm",
        requestedDecision: "redact",
        featureFlags: {
          [AI_MODERATION_FEATURE_FLAGS.moderation]: true,
          [AI_MODERATION_FEATURE_FLAGS.redaction]: true,
        },
        redactionTokens: [" ", "Zephod"],
      })
    ).toMatchObject({
      resolvedDecision: "redact",
      redactedText: "username: [REDACTED]",
      reasonCodes: ["redaction-applied"],
    });
  });

  it("does not return redacted text when redaction is disabled", () => {
    const result = resolveAiModerationDecision({
      text: "username: Zephod",
      correlationId: "corr-redact-disabled",
      channel: "dm",
      requestedDecision: "redact",
      featureFlags: {
        [AI_MODERATION_FEATURE_FLAGS.moderation]: true,
      },
      redactionTokens: ["Zephod"],
    });

    expect(result.resolvedDecision).toBe("escalate");
    expect(result.redactedText).toBeUndefined();
    expect(result.requiresHumanReview).toBe(true);
    expect(result.reasonCodes).toContain("redaction-disabled-escalated");
  });

  it("routes low-signal high-severity findings to warnings", () => {
    expect(
      resolveAiModerationDecision({
        text: "ambiguous report",
        correlationId: "corr-high-low-signal",
        channel: "forum",
        requestedDecision: "block",
        featureFlags: {
          [AI_MODERATION_FEATURE_FLAGS.moderation]: true,
        },
        findings: [
          {
            code: "possible-harm",
            message: "Low signal high-severity classifier output",
            severity: "high",
            signalScore: 0.2,
          },
        ],
      })
    ).toMatchObject({
      resolvedDecision: "warn",
      reasonCodes: ["low-signal-high-severity-warn"],
    });
  });

  it("quarantines medium-severity block requests for review", () => {
    expect(
      resolveAiModerationDecision({
        text: "needs review",
        correlationId: "corr-medium",
        channel: "ugc",
        requestedDecision: "block",
        featureFlags: {
          [AI_MODERATION_FEATURE_FLAGS.moderation]: true,
        },
        findings: [
          {
            code: "policy-medium",
            message: "Medium severity finding",
            severity: "medium",
            signalScore: 0.5,
          },
        ],
      })
    ).toMatchObject({
      resolvedDecision: "quarantine",
      reasonCodes: ["medium-severity-quarantined-for-review"],
    });
  });

  it("passes clean moderated text without redaction", () => {
    expect(
      resolveAiModerationDecision({
        text: "hello world",
        correlationId: "corr-pass",
        channel: "chat",
        featureFlags: {
          [AI_MODERATION_FEATURE_FLAGS.moderation]: true,
        },
      })
    ).toMatchObject({
      resolvedDecision: "allow",
      reasonCodes: ["moderation-pass"],
      redactedText: undefined,
    });
  });

  it("uses human review when redaction is disabled and review is enabled", () => {
    expect(
      resolveAiModerationDecision({
        text: "username: Zephod",
        correlationId: "corr-redact-human-review",
        channel: "dm",
        requestedDecision: "redact",
        featureFlags: {
          [AI_MODERATION_FEATURE_FLAGS.moderation]: true,
          [AI_MODERATION_FEATURE_FLAGS.humanReview]: true,
        },
      })
    ).toMatchObject({
      resolvedDecision: "human-review",
      reasonCodes: ["redaction-disabled-escalated"],
      redactedText: undefined,
    });
  });

  it("escalates critical findings when human review is disabled", () => {
    expect(
      resolveAiModerationDecision({
        text: "critical report",
        correlationId: "corr-critical-no-review",
        channel: "forum",
        featureFlags: {
          [AI_MODERATION_FEATURE_FLAGS.moderation]: true,
        },
        findings: [
          {
            code: "critical-policy",
            message: "Critical finding without review flag",
            severity: "critical",
          },
        ],
      })
    ).toMatchObject({
      resolvedDecision: "escalate",
      requiresHumanReview: true,
      reasonCodes: ["critical-finding-escalated"],
    });
  });

  it("treats malformed finding severity as non-blocking", () => {
    expect(
      resolveAiModerationDecision({
        text: "malformed classifier output",
        correlationId: "corr-malformed-severity",
        channel: "ugc",
        featureFlags: {
          [AI_MODERATION_FEATURE_FLAGS.moderation]: true,
        },
        findings: [
          {
            code: "malformed-severity",
            message: "Unexpected severity from an upstream classifier",
            severity: "unexpected" as never,
          },
        ],
      })
    ).toMatchObject({
      resolvedDecision: "allow",
      reasonCodes: ["moderation-pass"],
    });
  });

  it("preserves caller reason codes without adding a pass reason", () => {
    expect(
      resolveAiModerationDecision({
        text: "manual review note",
        correlationId: "corr-existing-reason",
        channel: "chat",
        featureFlags: {
          [AI_MODERATION_FEATURE_FLAGS.moderation]: true,
        },
        reasonCodes: ["upstream-reviewed"],
      })
    ).toMatchObject({
      resolvedDecision: "allow",
      reasonCodes: ["upstream-reviewed"],
    });
  });
});
