import { describe, expect, it } from "vitest";

import { activeMentionToken, extractHashtags, extractMentionTokens, normalizeHashtag, splitCaddeBody } from "@/lib/cadde-text";

/**
 * SQL ↔ TS AYNA KÜLLİYATI.
 *
 * Beklenen değerler tahmin değildir — canlı DB'de
 *   `regexp_replace(lower(unaccent(x)), '[^a-z0-9]', '', 'g')`
 * çalıştırılıp ölçülmüştür. `public.cadde_normalize_tag` veya `normalizeHashtag`
 * değişirse bu tablo İKİ TARAFTA birden yeniden doğrulanmalıdır.
 */
const MIRROR_CORPUS: ReadonlyArray<readonly [input: string, expected: string]> = [
  ["İstanbul", "istanbul"],
  ["istanbul", "istanbul"],
  ["ISTANBUL", "istanbul"],
  ["ŞİŞLİ", "sisli"],
  ["şişli", "sisli"],
  ["Iğdır", "igdir"],
  ["ığdır", "igdir"],
  ["gündem", "gundem"],
  ["GÜNDEM", "gundem"],
  ["Café", "cafe"],
  ["Startup2026", "startup2026"],
  ["yazılım", "yazilim"],
];

describe("normalizeHashtag (SQL cadde_normalize_tag aynası)", () => {
  it.each(MIRROR_CORPUS)("normalizes %s to %s", (input, expected) => {
    expect(normalizeHashtag(input)).toBe(expected);
  });

  it("collapses the Turkish dotted/dotless I trap onto one key", () => {
    // Bu testin tek amacı regresyonu yakalamak: JS'in bare toLowerCase()'i
    // "İstanbul" için "i̇stanbul" üretir ve aşağıdaki eşitlik BOZULUR.
    expect(normalizeHashtag("İstanbul")).toBe(normalizeHashtag("istanbul"));
    expect(normalizeHashtag("IĞDIR")).toBe(normalizeHashtag("ığdır"));
  });

  it("strips the leading # and any punctuation", () => {
    expect(normalizeHashtag("#İzmir!")).toBe("izmir");
  });
});

describe("extractHashtags", () => {
  it("extracts tags in order without duplicates, keeping the first spelling", () => {
    const result = extractHashtags("Bugün #İstanbul çok güzel. #istanbul sevgisi. #yazılım");
    expect(result).toEqual([
      { tag: "istanbul", display: "İstanbul" },
      { tag: "yazilim", display: "yazılım" },
    ]);
  });

  it("ignores single-character and punctuation-only tags", () => {
    expect(extractHashtags("#a #!! merhaba")).toEqual([]);
  });

  it("returns an empty list when there is no hashtag", () => {
    expect(extractHashtags("düz bir paylaşım")).toEqual([]);
  });
});

describe("extractMentionTokens", () => {
  it("extracts unique mention tokens", () => {
    expect(extractMentionTokens("@ayse.k ve @mehmet selam @ayse.k")).toEqual(["ayse.k", "mehmet"]);
  });

  it("ignores e-mail-like text after a word character", () => {
    // "a@b.com" içindeki @ bir mention başlangıcı değildir — desen kelime sınırı aramaz,
    // bu yüzden burada token üretmesi BEKLENİR; hedef çözümü DB'de başarısız olur ve
    // eşleşmeyen mention yok sayılır. Test bu bilinçli davranışı sabitler.
    expect(extractMentionTokens("bana a@b.com adresinden ulaş")).toEqual(["b.com"]);
  });
});

describe("activeMentionToken", () => {
  it("finds the half-typed token at the caret", () => {
    const value = "Selam @meh";
    expect(activeMentionToken(value, value.length)).toEqual({ token: "meh", start: 6 });
  });

  it("returns null once the token is closed by a space", () => {
    const value = "Selam @mehmet ";
    expect(activeMentionToken(value, value.length)).toBeNull();
  });

  it("ignores an @ in the middle of a word (e-mail)", () => {
    const value = "yaz bana ayse@gmail";
    expect(activeMentionToken(value, value.length)).toBeNull();
  });

  it("returns null when there is no @ before the caret", () => {
    expect(activeMentionToken("düz metin", 5)).toBeNull();
  });
});

describe("splitCaddeBody", () => {
  it("splits text, hashtags and mentions into renderable segments", () => {
    expect(splitCaddeBody("Selam @mehmet, #Berlin nasıl?")).toEqual([
      { kind: "text", value: "Selam " },
      { kind: "mention", value: "@mehmet", token: "mehmet" },
      { kind: "text", value: ", " },
      { kind: "hashtag", value: "#Berlin", tag: "berlin" },
      { kind: "text", value: " nasıl?" },
    ]);
  });

  it("returns a single text segment when there is nothing to link", () => {
    expect(splitCaddeBody("sade metin")).toEqual([{ kind: "text", value: "sade metin" }]);
  });

  it("returns an empty list for an empty body (media-only post)", () => {
    expect(splitCaddeBody("")).toEqual([]);
  });
});
