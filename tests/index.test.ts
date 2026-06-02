import { describe, expect, it } from "vitest";

import {
  AI_MODERATION_ENV_PREFIX,
  AI_MODERATION_FEATURE_FLAG_ID,
  AI_MODERATION_PACKAGE,
  packageDescriptor,
} from "../src/index.js";

describe("@plasius/ai-moderation", () => {
  it("exports the package descriptor contract", () => {
    expect(packageDescriptor.packageName).toBe(AI_MODERATION_PACKAGE);
    expect(packageDescriptor.featureFlagId).toBe(AI_MODERATION_FEATURE_FLAG_ID);
    expect(packageDescriptor.envPrefix).toBe(AI_MODERATION_ENV_PREFIX);
    expect(packageDescriptor.summary.length).toBeGreaterThan(0);
  });
});
