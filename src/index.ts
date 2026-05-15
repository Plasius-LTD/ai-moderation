export interface AiPackageDescriptor {
  readonly packageName: string;
  readonly featureFlagId: string;
  readonly envPrefix: string;
  readonly summary: string;
}

export const AI_MODERATION_PACKAGE = "@plasius/ai-moderation";
export const AI_MODERATION_FEATURE_FLAG_ID = "ai.moderation.enabled";
export const AI_MODERATION_ENV_PREFIX = "AI_MODERATION";

export const AI_MODERATION_FEATURE_FLAGS = {
  moderation: AI_MODERATION_FEATURE_FLAG_ID,
  humanReview: "ai.moderation.human-review.enabled",
  redaction: "ai.moderation.redaction.enabled",
} as const;

export type AiModerationFeatureFlagKey =
  (typeof AI_MODERATION_FEATURE_FLAGS)[keyof typeof AI_MODERATION_FEATURE_FLAGS];

type AiModerationFeatureFlagSnapshot = Readonly<
  Record<string, boolean | undefined>
>;

export const AI_MODERATION_DECISIONS = [
  "allow",
  "warn",
  "redact",
  "block",
  "quarantine",
  "escalate",
  "human-review",
] as const;

export type AiModerationDecision =
  (typeof AI_MODERATION_DECISIONS)[number];

export const AI_MODERATION_SEVERITIES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type AiModerationSeverity = (typeof AI_MODERATION_SEVERITIES)[number];

export const AI_MODERATION_CHANNELS = [
  "chat",
  "forum",
  "dm",
  "ugc",
] as const;

export type AiModerationChannel = (typeof AI_MODERATION_CHANNELS)[number];

export interface AiModerationFinding {
  readonly code: string;
  readonly message: string;
  readonly severity: AiModerationSeverity;
  readonly signalScore?: number;
}

export interface AiModerationAuditMetadata {
  readonly correlationId: string;
  readonly requestId?: string;
  readonly actorId?: string;
  readonly channel: AiModerationChannel;
  readonly evaluatedAtUtc: string;
  readonly decision: AiModerationDecision;
}

export interface ResolveAiModerationInput {
  readonly text: string;
  readonly correlationId: string;
  readonly channel: AiModerationChannel;
  readonly requestedDecision?: AiModerationDecision;
  readonly featureFlags?: AiModerationFeatureFlagSnapshot;
  readonly reasonCodes?: readonly string[];
  readonly findings?: readonly AiModerationFinding[];
  readonly actorId?: string;
  readonly requestId?: string;
  readonly redactionTokens?: readonly string[];
}

export interface ResolveAiModerationResult {
  readonly requestedDecision: AiModerationDecision;
  readonly resolvedDecision: AiModerationDecision;
  readonly reasonCodes: readonly string[];
  readonly redactedText?: string;
  readonly requiresHumanReview: boolean;
  readonly enabledFeatureFlags: readonly AiModerationFeatureFlagKey[];
  readonly findings: readonly AiModerationFinding[];
  readonly audit: AiModerationAuditMetadata;
}

function nowIsoString(): string {
  return new Date().toISOString();
}

function normalizeText(value: string): string {
  return value.trim();
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function getSeverityScore(severity: AiModerationSeverity): number {
  switch (severity) {
    case "low":
      return 0.2;
    case "medium":
      return 0.5;
    case "high":
      return 0.8;
    case "critical":
      return 1;
    default:
      return 0;
  }
}

function redactionText(
  text: string,
  tokens: readonly string[] = []
): string {
  return tokens.reduce((acc, token) => {
    if (!token.trim()) {
      return acc;
    }

    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return acc.replaceAll(new RegExp(escaped, "giu"), "[REDACTED]");
  }, text);
}

export function isAiModerationEnabled(
  featureFlag: AiModerationFeatureFlagKey,
  snapshot: AiModerationFeatureFlagSnapshot = {}
): boolean {
  return snapshot[featureFlag] === true;
}

export function resolveAiModerationDecision(
  input: ResolveAiModerationInput
): ResolveAiModerationResult {
  const featureFlags = input.featureFlags ?? {};
  const moderationEnabled = isAiModerationEnabled(
    AI_MODERATION_FEATURE_FLAGS.moderation,
    featureFlags
  );
  const redactionEnabled = isAiModerationEnabled(
    AI_MODERATION_FEATURE_FLAGS.redaction,
    featureFlags
  );
  const humanReviewEnabled = isAiModerationEnabled(
    AI_MODERATION_FEATURE_FLAGS.humanReview,
    featureFlags
  );
  const enabledFeatureFlags: AiModerationFeatureFlagKey[] = [];
  const reasonCodes = [...(input.reasonCodes ?? [])];
  const findings = [...(input.findings ?? [])];
  const requestedDecision = input.requestedDecision ?? "allow";

  if (moderationEnabled) {
    enabledFeatureFlags.push(AI_MODERATION_FEATURE_FLAGS.moderation);
  }
  if (humanReviewEnabled) {
    enabledFeatureFlags.push(AI_MODERATION_FEATURE_FLAGS.humanReview);
  }
  if (redactionEnabled) {
    enabledFeatureFlags.push(AI_MODERATION_FEATURE_FLAGS.redaction);
  }

  if (!moderationEnabled) {
    return {
      requestedDecision,
      resolvedDecision: "allow",
      reasonCodes: [
        ...reasonCodes,
        "ai-moderation-disabled-fallback-allow",
      ],
      requiresHumanReview: false,
      enabledFeatureFlags: [],
      findings,
      audit: {
        correlationId: input.correlationId,
        requestId: input.requestId,
        actorId: input.actorId,
        channel: input.channel,
        evaluatedAtUtc: nowIsoString(),
        decision: "allow",
      },
    };
  }

  const text = normalizeText(input.text);
  const hasFindings = findings.length > 0;
  const maxSeverity = findings.reduce<AiModerationSeverity>(
    (carry, item) =>
      getSeverityScore(item.severity) > getSeverityScore(carry)
        ? item.severity
        : carry,
    "low"
  );
  const maxSignal = findings.reduce<number>(
    (carry, item) => Math.max(carry, clampConfidence(item.signalScore ?? 0.5)),
    0
  );

  let resolvedDecision: AiModerationDecision = requestedDecision;

  if (hasFindings && maxSeverity === "critical") {
    resolvedDecision = humanReviewEnabled ? "human-review" : "escalate";
    reasonCodes.push("critical-finding-escalated");
  } else if (hasFindings && maxSeverity === "high" && maxSignal < 0.5) {
    resolvedDecision = "warn";
    reasonCodes.push("low-signal-high-severity-warn");
  } else if (
    requestedDecision === "block" &&
    maxSeverity === "medium" &&
    maxSignal < 0.6
  ) {
    resolvedDecision = "quarantine";
    reasonCodes.push("medium-severity-quarantined-for-review");
  } else if (
    requestedDecision === "redact" &&
    !redactionEnabled
  ) {
    resolvedDecision = humanReviewEnabled ? "human-review" : "escalate";
    reasonCodes.push("redaction-disabled-escalated");
  } else if (
    requestedDecision === "redact" &&
    redactionEnabled &&
    (findings.length > 0 || /\w{2,}/u.test(text))
  ) {
    reasonCodes.push("redaction-applied");
  } else if (reasonCodes.length === 0) {
    reasonCodes.push("moderation-pass");
  }

  const redactedText =
    resolvedDecision === "redact" && redactionEnabled
      ? redactionText(text, input.redactionTokens)
      : undefined;

  return {
    requestedDecision,
    resolvedDecision,
    reasonCodes,
    redactedText,
    requiresHumanReview:
      resolvedDecision === "human-review" || resolvedDecision === "escalate",
    enabledFeatureFlags,
    findings,
    audit: {
      correlationId: input.correlationId,
      requestId: input.requestId,
      actorId: input.actorId,
      channel: input.channel,
      evaluatedAtUtc: nowIsoString(),
      decision: resolvedDecision,
    },
  };
}

export const packageDescriptor: AiPackageDescriptor = Object.freeze({
  packageName: AI_MODERATION_PACKAGE,
  featureFlagId: AI_MODERATION_FEATURE_FLAG_ID,
  envPrefix: AI_MODERATION_ENV_PREFIX,
  summary:
    "Forum, chat, profanity, and enforcement moderation contracts for Plasius AI governance.",
});
