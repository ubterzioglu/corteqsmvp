import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PublicProfileSectionViewModel } from "@/lib/public-catalog-profile-view-model";

import GenericPublicSection from "./GenericPublicSection";
import RichTextSection from "./RichTextSection";
import {
  GENERIC_PUBLIC_SECTION_RENDERER,
  PUBLIC_SECTION_RENDERERS,
  resolvePublicSectionRenderer,
} from "./renderer-registry";

const makeSection = (
  overrides: Partial<PublicProfileSectionViewModel> = {},
): PublicProfileSectionViewModel => ({
  key: "detail.test",
  label: "Test Bölümü",
  description: null,
  componentKey: "rich_text",
  placement: "main",
  sortOrder: 100,
  content: {},
  ...overrides,
});

describe("resolvePublicSectionRenderer", () => {
  it("resolves known component keys to their renderer", () => {
    expect(resolvePublicSectionRenderer("rich_text").Component).toBe(RichTextSection);
    for (const key of Object.keys(PUBLIC_SECTION_RENDERERS)) {
      expect(resolvePublicSectionRenderer(key)).toBe(PUBLIC_SECTION_RENDERERS[key]);
    }
  });

  it("falls back to the generic renderer for null keys", () => {
    expect(resolvePublicSectionRenderer(null)).toBe(GENERIC_PUBLIC_SECTION_RENDERER);
  });

  it("falls back to the generic renderer for unknown keys", () => {
    expect(resolvePublicSectionRenderer("brand_new_widget").Component).toBe(GenericPublicSection);
  });

  it("generic fallback renders safe primitives without crashing", () => {
    const section = makeSection({
      componentKey: "brand_new_widget",
      content: {
        headline: "Yeni içerik",
        tags: ["a", "b"],
        nested: { secret: "asla" },
      },
    });
    const { Component } = resolvePublicSectionRenderer(section.componentKey);
    render(<Component section={section} />);

    expect(screen.getByText("Yeni içerik")).toBeInTheDocument();
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.queryByText(/asla/)).not.toBeInTheDocument();
    expect(screen.queryByText(/secret/)).not.toBeInTheDocument();
  });

  it("generic fallback shows a friendly message for empty content", () => {
    const section = makeSection({ componentKey: "brand_new_widget", content: {} });
    const { Component } = resolvePublicSectionRenderer(section.componentKey);
    render(<Component section={section} />);
    expect(screen.getByText(/yakında eklenecek/i)).toBeInTheDocument();
  });
});
