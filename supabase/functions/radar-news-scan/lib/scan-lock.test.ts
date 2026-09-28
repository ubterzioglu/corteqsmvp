import { describe, expect, it } from "vitest";

import { SCAN_LOCK_STALE_MS, acquireScanLock } from "./scan-lock.ts";

const NOW = new Date("2026-09-28T21:00:00.000Z");
const minutesAgo = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

/**
 * `acquireScanLock`'ın kullandığı zincirin en dar taklidi:
 *   from().select().eq().order().limit().maybeSingle()
 *   from().update().eq().eq()
 */
function fakeSupabase(options: {
  row?: { id: string; started_at: string | null } | null;
  selectError?: { message: string };
  updateError?: { message: string };
}) {
  const updates: Array<Record<string, unknown>> = [];

  const selectChain = {
    eq: () => selectChain,
    order: () => selectChain,
    limit: () => selectChain,
    maybeSingle: async () => ({
      data: options.row ?? null,
      error: options.selectError ?? null,
    }),
  };

  const client = {
    from: () => ({
      select: () => selectChain,
      update: (payload: Record<string, unknown>) => {
        updates.push(payload);
        const updChain = {
          eq: () => updChain,
          then: (resolve: (v: unknown) => unknown) =>
            resolve({ error: options.updateError ?? null }),
        };
        return updChain;
      },
    }),
  };

  return { client: client as never, updates };
}

describe("acquireScanLock", () => {
  it("calisan kosu YOKSA kilidi verir", async () => {
    const { client } = fakeSupabase({ row: null });
    await expect(acquireScanLock(client, NOW)).resolves.toBe(true);
  });

  it("TAZE bir kosu varsa kilidi VERMEZ", async () => {
    const { client, updates } = fakeSupabase({
      row: { id: "kosu-1", started_at: minutesAgo(2) },
    });
    await expect(acquireScanLock(client, NOW)).resolves.toBe(false);
    // Yasayan kosunun kaydina DOKUNULMAMALI.
    expect(updates).toHaveLength(0);
  });

  it("esigin hemen ALTINDAKI kosu hala yasiyor sayilir", async () => {
    const { client } = fakeSupabase({
      row: { id: "kosu-1", started_at: new Date(NOW.getTime() - SCAN_LOCK_STALE_MS + 1000).toISOString() },
    });
    await expect(acquireScanLock(client, NOW)).resolves.toBe(false);
  });

  it("BAYAT kosuyu failed olarak kapatir ve kilidi verir", async () => {
    // ⚠️ Asil kusur buydu: 14.09'da olen kosu `running` kaldi ve Radar'i 14 gun
    // boyunca kilitledi. Esik olmadan bu test imkansizdir.
    const { client, updates } = fakeSupabase({
      row: { id: "kosu-olu", started_at: minutesAgo(45) },
    });

    await expect(acquireScanLock(client, NOW)).resolves.toBe(true);
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ status: "failed" });
    expect(String(updates[0].error_message)).toContain("Bayat kilit");
  });

  it("started_at OKUNAMIYORSA kosu yasiyor sayilir (kilit verilmez)", async () => {
    // Bilinmeyeni "olu" kabul etmek, calisan bir taramanin uzerine ikincisini baslatirdi.
    for (const bozuk of [null, "", "tarih-degil"]) {
      const { client, updates } = fakeSupabase({
        row: { id: "kosu-1", started_at: bozuk },
      });
      await expect(acquireScanLock(client, NOW)).resolves.toBe(false);
      expect(updates).toHaveLength(0);
    }
  });

  it("select hatasini YUTMAZ", async () => {
    const { client } = fakeSupabase({ row: null, selectError: { message: "baglanti koptu" } });
    await expect(acquireScanLock(client, NOW)).rejects.toThrow("Lock kontrolü başarısız");
  });

  it("bayat kilit kapatilamazsa SESSIZCE devam ETMEZ", async () => {
    // Kapatma basarisizken true donmek, her cagrida ayni bayat satiri "kapattim"
    // sanip ust uste tarama baslatirdi.
    const { client } = fakeSupabase({
      row: { id: "kosu-olu", started_at: minutesAgo(45) },
      updateError: { message: "izin yok" },
    });
    await expect(acquireScanLock(client, NOW)).rejects.toThrow("Bayat kilit kapatılamadı");
  });

  it("varsayilan esik 30 dakikadir", () => {
    expect(SCAN_LOCK_STALE_MS).toBe(30 * 60 * 1000);
  });
});

describe("gercek olay kaydi (2026-09-14)", () => {
  it("14.09'da takilan kosu, 28.09'daki cron icin BAYATtir", async () => {
    const stuckStart = "2026-09-14T05:02:14.151Z";
    const cron28 = new Date("2026-09-28T05:00:00.000Z");
    const { client, updates } = fakeSupabase({ row: { id: "63f1f634", started_at: stuckStart } });

    // Eski davranista bu false donuyordu ve fonksiyon 409 ile cikiyordu.
    await expect(acquireScanLock(client, cron28)).resolves.toBe(true);
    expect(updates[0]).toMatchObject({ status: "failed" });
  });
});

// ⚠️ NOT (test degil, kayit): `index.ts`'te kaynak dongusu ZATEN try/catch ile saridir
// ve 14.09'daki GDELT hatasini yakalayip DB'ye yazmistir — yani kosu o hatadan olmedi,
// olum dongudEN SONRA oldu (muhtemelen isolate oldurulmesi ya da o gun Nano compute'ta
// kapanis update'inin dusmesi). Bu yuzden "index.ts'i genel try/catch ile sar" bu olayi
// ONLEMEZDI; sebebi ne olursa olsun kilidin kendi kendini cozmesi dogru cozumdur.
