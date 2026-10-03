/**
 * CD03 · FeedView düzenleme kablolaması — kaynak sözleşmesi.
 *
 * CaddeFeedView ağır prop setiyle render edildiği için (74 testlik CaddePage
 * sözleşmesi zaten var) kablolama burada G02/G03b deseniyle KAYNAKTAN
 * kilitlenir: onSubmit dallanması (edit → updateMutation) · editMode/onCancelEdit
 * prop'ları · menü onEdit'inin startEditing'e taşıdığı alanlar (T1: mentions
 * TAŞINMAZ · T3: konum tek hedef hook'ta).
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { sliceBetween } from "@/test/source-slice";

const source = readFileSync("src/components/cadde/CaddeFeedView.tsx", "utf8");

describe("CaddeFeedView · CD03 düzenleme kablolaması", () => {
  it("composer onSubmit edit modunda updateMutation'a dallanır", () => {
    expect(source).toContain(
      "onSubmit={() => (editingPostId ? updateMutation.mutate() : postMutation.mutate())}",
    );
    expect(source).toContain("isSubmitting={postMutation.isPending || updateMutation.isPending}");
  });

  it("composer editMode + onCancelEdit alır", () => {
    expect(source).toContain("editMode={Boolean(editingPostId)}");
    expect(source).toContain("onCancelEdit={cancelEditing}");
  });

  it("menü onEdit → startEditing: body/media/konum taşınır, mentions TAŞINMAZ (T1)", () => {
    const onEdit = sliceBetween(source, "onEdit={() => {", "scrollToComposer();", "onEdit bloğu");

    expect(onEdit).toContain("startEditing({");
    expect(onEdit).toContain("body: item.post.body");
    expect(onEdit).toContain("media: item.post.media ?? []");
    expect(onEdit).toContain('country: item.post.country ?? ""');
    expect(onEdit).toContain('city: item.post.city ?? ""');
    expect(onEdit).not.toContain("mentions");
  });

  it("composerState'ten düzenleme alanları çözülür (hook sözleşmesi)", () => {
    const destructure = sliceBetween(source, "const {", "} = composerState;", "composerState çözümü");

    expect(destructure).toContain("editingPostId");
    expect(destructure).toContain("updateMutation");
    expect(destructure).toContain("startEditing");
    expect(destructure).toContain("cancelEditing");
  });

  it("menü yalnız kendi gönderisinde çizilir (A11c görünürlük kapısı korunur)", () => {
    expect(source).toContain("session && item.post.authorUserId === user?.id ? (");
  });
});
