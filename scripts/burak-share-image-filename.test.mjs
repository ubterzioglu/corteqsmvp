import { describe, expect, it } from "vitest";

import { parseBurakImageFilename } from "./burak-share-image-filename.mjs";

describe("parseBurakImageFilename", () => {
  it("parses 2-digit filenames as variant 1 (variant digit omitted)", () => {
    expect(parseBurakImageFilename("11.png")).toEqual({ toolOrder: 1, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("12.png")).toEqual({ toolOrder: 1, variant: 1, promptNo: 2 });
    expect(parseBurakImageFilename("21.png")).toEqual({ toolOrder: 2, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("22.png")).toEqual({ toolOrder: 2, variant: 1, promptNo: 2 });
    expect(parseBurakImageFilename("41.png")).toEqual({ toolOrder: 4, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("91.png")).toEqual({ toolOrder: 9, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("101.png")).toEqual({ toolOrder: 10, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("102.png")).toEqual({ toolOrder: 10, variant: 1, promptNo: 2 });
    expect(parseBurakImageFilename("111.png")).toEqual({ toolOrder: 11, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("112.png")).toEqual({ toolOrder: 11, variant: 1, promptNo: 2 });
  });

  it("parses 3-digit filenames with explicit variant 2 or 3", () => {
    expect(parseBurakImageFilename("311.png")).toEqual({ toolOrder: 3, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("312.png")).toEqual({ toolOrder: 3, variant: 1, promptNo: 2 });
    expect(parseBurakImageFilename("321.png")).toEqual({ toolOrder: 3, variant: 2, promptNo: 1 });
    expect(parseBurakImageFilename("322.png")).toEqual({ toolOrder: 3, variant: 2, promptNo: 2 });
    expect(parseBurakImageFilename("811.png")).toEqual({ toolOrder: 8, variant: 1, promptNo: 1 });
    expect(parseBurakImageFilename("821.png")).toEqual({ toolOrder: 8, variant: 2, promptNo: 1 });
    expect(parseBurakImageFilename("831.png")).toEqual({ toolOrder: 8, variant: 3, promptNo: 1 });
    expect(parseBurakImageFilename("832.png")).toEqual({ toolOrder: 8, variant: 3, promptNo: 2 });
  });

  it("parses 4-digit filenames for 2-digit tool numbers with explicit variant", () => {
    expect(parseBurakImageFilename("1221.png")).toEqual({ toolOrder: 12, variant: 2, promptNo: 1 });
    expect(parseBurakImageFilename("1222.png")).toEqual({ toolOrder: 12, variant: 2, promptNo: 2 });
    expect(parseBurakImageFilename("1231.png")).toEqual({ toolOrder: 12, variant: 3, promptNo: 1 });
    expect(parseBurakImageFilename("1232.png")).toEqual({ toolOrder: 12, variant: 3, promptNo: 2 });
  });

  it("returns null for non-png files", () => {
    expect(parseBurakImageFilename("11.jpg")).toBeNull();
    expect(parseBurakImageFilename("readme.md")).toBeNull();
  });

  it("returns null for non-numeric or malformed basenames", () => {
    expect(parseBurakImageFilename("tool-1_p1.png")).toBeNull();
    expect(parseBurakImageFilename("abc.png")).toBeNull();
    expect(parseBurakImageFilename(".png")).toBeNull();
  });

  it("returns null for invalid promptNo or variant digits", () => {
    expect(parseBurakImageFilename("13.png")).toBeNull();
    expect(parseBurakImageFilename("340.png")).toBeNull();
  });
});
