export interface AiPackageDescriptor {
  readonly packageName: string;
  readonly featureFlagId: string;
  readonly envPrefix: string;
  readonly summary: string;
}

export const AI_MODERATION_PACKAGE = "@plasius/ai-moderation";
export const AI_MODERATION_FEATURE_FLAG_ID = "ai.moderation.enabled";
export const AI_MODERATION_ENV_PREFIX = "AI_MODERATION";

export const packageDescriptor: AiPackageDescriptor = Object.freeze({
  packageName: AI_MODERATION_PACKAGE,
  featureFlagId: AI_MODERATION_FEATURE_FLAG_ID,
  envPrefix: AI_MODERATION_ENV_PREFIX,
  summary: "Forum, chat, profanity, and enforcement moderation contracts for Plasius AI governance.",
});
