import { describe, expect, it } from "vitest";

import { INITIAL_DATA, getProgressInfo } from "@/lib/chatConfig";

// CH01 (07.11.2026): eski kayıt sohbeti (useChatMachine + chatReducer + detectCommand) ölü
// koddu — Haziran 2026'dan beri hiçbir ekran çağırmıyordu; yalnız testleri onu check:dead ve
// knip'e "kullanılıyor" gösteriyordu. Canlı bilgi asistanı (ChatBot → ChatWindow) bu
// modülden yalnız tipleri, INITIAL_DATA'yı ve getProgressInfo'yu kullanır. Yeni bir
// çalışma anı dışa aktarımı eklersen ÜRETİMDE bir çağıranı olsun ve buraya bilerek yaz.
describe("chatConfig yalnız canlı sohbetin kullandığını dışa verir (CH01)", () => {
  it("çalışma anı dışa aktarımları INITIAL_DATA ve getProgressInfo'dur", async () => {
    const chatConfig = await import("@/lib/chatConfig");
    expect(Object.keys(chatConfig).sort()).toEqual(["INITIAL_DATA", "getProgressInfo"]);
  });
});

describe("getProgressInfo", () => {
  it("boş veride ilerleme sıfırdır", () => {
    expect(getProgressInfo("welcome", { ...INITIAL_DATA })).toEqual({ completed: 0, total: 8, percentage: 0 });
  });

  it("yalnız zorunlu alanları sayar ve yüzdeyi yuvarlar", () => {
    const progress = getProgressInfo("welcome", {
      ...INITIAL_DATA,
      fullname: "Ada Lovelace",
      city: "Berlin",
      email: "ada@example.com",
      // Zorunlu değil — sayılmaz.
      business: "Analytical Engines",
      offers_needs: "Ağ",
    });
    expect(progress).toEqual({ completed: 3, total: 8, percentage: 38 });
  });

  it("zorunlu alanların tamamı dolunca yüzde yüzdür", () => {
    const progress = getProgressInfo("welcome", {
      ...INITIAL_DATA,
      category: "danisman",
      fullname: "Ada Lovelace",
      country: "Almanya",
      city: "Berlin",
      field: "Yazılım",
      email: "ada@example.com",
      phone: "+491701234567",
      consent: true,
    });
    expect(progress).toEqual({ completed: 8, total: 8, percentage: 100 });
  });
});
