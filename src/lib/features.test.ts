import { describe, expect, it } from "vitest";

import { APP_FEATURE_KEY_LIST, GENERIC_FEATURE_KEYS, getFeatureMeta, INDIVIDUAL_FEATURE_KEYS } from "@/lib/features";

describe("features", () => {
  it("includes the new individual profile visibility features in the app feature registry", () => {
    expect(APP_FEATURE_KEY_LIST).toContain(INDIVIDUAL_FEATURE_KEYS.jobSeekingBadge);
    expect(APP_FEATURE_KEY_LIST).toContain(INDIVIDUAL_FEATURE_KEYS.movingSoonBadge);
    expect(APP_FEATURE_KEY_LIST).toContain(INDIVIDUAL_FEATURE_KEYS.volunteerMentorship);
    expect(APP_FEATURE_KEY_LIST).toContain(GENERIC_FEATURE_KEYS.profileLinkedinCard);
    expect(APP_FEATURE_KEY_LIST).toContain(GENERIC_FEATURE_KEYS.profileWebsiteCard);
    expect(APP_FEATURE_KEY_LIST).toContain(GENERIC_FEATURE_KEYS.profileCvUpload);
    expect(APP_FEATURE_KEY_LIST).toContain(GENERIC_FEATURE_KEYS.profilePresentationUpload);
  });

  it("returns readable metadata for the new individual profile visibility features", () => {
    expect(getFeatureMeta(INDIVIDUAL_FEATURE_KEYS.jobSeekingBadge)?.label).toBe("İş Arıyorum Badge'i");
    expect(getFeatureMeta(INDIVIDUAL_FEATURE_KEYS.movingSoonBadge)?.label).toBe("Yakında Taşınacağım");
    expect(getFeatureMeta(INDIVIDUAL_FEATURE_KEYS.volunteerMentorship)?.label).toBe("Gönüllü Mentörlük");
    expect(getFeatureMeta(GENERIC_FEATURE_KEYS.profileLinkedinCard)?.label).toBe("LinkedIn Kartı");
    expect(getFeatureMeta(GENERIC_FEATURE_KEYS.profileWebsiteCard)?.label).toBe("Web Sitesi Kartı");
    expect(getFeatureMeta(GENERIC_FEATURE_KEYS.profileCvUpload)?.label).toBe("CV Yükleme");
    expect(getFeatureMeta(GENERIC_FEATURE_KEYS.profilePresentationUpload)?.label).toBe("Sunum Yükleme");
  });
});
