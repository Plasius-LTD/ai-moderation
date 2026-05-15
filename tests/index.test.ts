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
        redactionTokens: ["Zephod"],
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
});
