import { describe, expect, it } from "vitest";

import {
  contributorResourceStatus,
  validateContributorResourceInput,
  type ContributorResourceInput,
} from "@/lib/contributor-resource-submissions";

const validInput: ContributorResourceInput = {
  resourceType: "business",
  displayName: "Berlin Türk Kitabevi",
  country: "Almanya",
  city: "Berlin",
  sourceUrl: "https://example.org/berlin",
  summary: "Şehirdeki Türkçe kitap kaynağı.",
  verifiedOn: "2026-08-30",
  permissionStatus: "not_required",
  conflictDisclosure: "",
};

describe("contributor resource submissions", () => {
  it("accepts the minimum verified source contract", () => {
    expect(validateContributorResourceInput(validInput)).toBeNull();
  });

  it("rejects unsafe URLs and missing evidence fields", () => {
    expect(validateContributorResourceInput({
      ...validInput,
      displayName: " ",
      sourceUrl: "javascript:alert(1)",
      verifiedOn: "",
    })).toMatch(/ad|http|kontrol/i);
    expect(validateContributorResourceInput({
      ...validInput,
      sourceUrl: "https://user:secret@example.org/private",
    })).toMatch(/kullanıcı adı|parola/i);
  });

  it("does not trust unknown database statuses", () => {
    expect(contributorResourceStatus("accepted")).toBe("accepted");
    expect(contributorResourceStatus("invented-status")).toBe("submitted");
  });
});
