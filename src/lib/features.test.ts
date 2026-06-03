import { describe, expect, it } from "vitest";

import { APP_FEATURE_KEY_LIST, getFeatureMeta, INDIVIDUAL_FEATURE_KEYS } from "@/lib/features";

describe("features", () => {
  it("includes the new individual profile visibility features in the app feature registry", () => {
    expect(APP_FEATURE_KEY_LIST).toContain(INDIVIDUAL_FEATURE_KEYS.jobSeekingBadge);
    expect(APP_FEATURE_KEY_LIST).toContain(INDIVIDUAL_FEATURE_KEYS.movingSoonBadge);
    expect(APP_FEATURE_KEY_LIST).toContain(INDIVIDUAL_FEATURE_KEYS.volunteerMentorship);
  });

  it("returns readable metadata for the new individual profile visibility features", () => {
    expect(getFeatureMeta(INDIVIDUAL_FEATURE_KEYS.jobSeekingBadge)?.label).toBe("İş Arıyorum Badge'i");
    expect(getFeatureMeta(INDIVIDUAL_FEATURE_KEYS.movingSoonBadge)?.label).toBe("Yakında Taşınacağım");
    expect(getFeatureMeta(INDIVIDUAL_FEATURE_KEYS.volunteerMentorship)?.label).toBe("Gönüllü Mentörlük");
  });
});
