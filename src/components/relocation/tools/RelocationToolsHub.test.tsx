// RelocationToolsHub — dizin kurgusu: arama + kategori filtresi + tek kart gridi.
// Bu testler 2026-08-06 premium yeniden tasarımının sözleşmelerini kilitler:
// kategori sekmeleri VERİDEN üretilir, arama Türkçe-duyarlıdır, boş sonuç çıkmaz sokak değildir.
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { RelocationToolsHub } from "@/components/relocation/tools/RelocationToolsHub";
import type { RelocationToolRow } from "@/lib/relocation-tools-types";

function tool(overrides: Partial<RelocationToolRow> & Pick<RelocationToolRow, "key">): RelocationToolRow {
  return {
    slug: overrides.key.replace(/_/g, "-"),
    title_tr: "Başlık",
    title_en: null,
    summary_tr: "Özet",
    category: "relocation_assessment",
    quick_question_count: 5,
    detailed_question_count: 10,
    is_active: true,
    requires_auth: true,
    result_kind: "score",
    sort_order: 10,
    weights: {},
    ...overrides,
  };
}

const TOOLS: RelocationToolRow[] = [
  tool({
    key: "country_match",
    slug: "ulke-secimi",
    title_tr: "Hangi Ülke Sana Uygun?",
    summary_tr: "Bütçe ve kariyer önceliklerine göre ülkeleri sıralar.",
    result_kind: "ranked_list",
  }),
  tool({
    key: "profession_salary",
    slug: "meslek-maas-karsilastirma",
    title_tr: "Mesleğiniz Dünyada Ne Kazandırıyor?",
    summary_tr: "Brüt/net maaş bandını karşılaştırır.",
    result_kind: "comparison",
  }),
  tool({
    key: "vize_secim_almanya",
    slug: "vize-secim-almanya",
    title_tr: "Vize Seçimi",
    summary_tr: "Sana en uygun vize yolunu bulur.",
    category: "germany_tools",
    quick_question_count: 0,
    detailed_question_count: 0,
  }),
  tool({
    key: "banka_secim_almanya",
    slug: "banka-secim-almanya",
    title_tr: "Banka Seçimi",
    summary_tr: "Sana en uygun 3 bankayı önerir.",
    category: "germany_tools",
    result_kind: "ranked_list",
  }),
];

function renderHub(props: Partial<Parameters<typeof RelocationToolsHub>[0]> = {}) {
  return render(
    <MemoryRouter>
      <RelocationToolsHub tools={TOOLS} {...props} />
    </MemoryRouter>,
  );
}

const grid = () => screen.getByRole("link", { name: /Hangi Ülke/ }).parentElement!;

describe("RelocationToolsHub", () => {
  it("kategori sekmelerini veriden üretir ve sayıları verideki dağılımı gösterir", () => {
    renderHub();

    expect(screen.getByRole("button", { name: /Tümü\s*4/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Taşınma\s*2/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Almanya\s*2/ })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("bilinmeyen kategoriyi ham anahtarla gösterir — yeni kategori eklenince araç kaybolmaz", () => {
    renderHub({ tools: [...TOOLS, tool({ key: "yeni_arac", category: "heniz_tanimsiz" })] });

    expect(screen.getByRole("button", { name: /heniz_tanimsiz\s*1/ })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(5);
  });

  it("kategori seçilince yalnızca o kategorinin araçları kalır", async () => {
    const user = userEvent.setup();
    renderHub();

    await user.click(screen.getByRole("button", { name: /Almanya\s*2/ }));

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links.map((link) => link.textContent)).toEqual([
      expect.stringContaining("Vize Seçimi"),
      expect.stringContaining("Banka Seçimi"),
    ]);
    expect(screen.getByRole("button", { name: /Almanya\s*2/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("arama Türkçe-duyarlı ve aksan-toleranslıdır: 'maas' → 'Maaş' eşleşir", async () => {
    const user = userEvent.setup();
    renderHub();

    await user.type(screen.getByRole("searchbox", { name: "Araçlarda ara" }), "kazandiriyor");

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent("Mesleğiniz Dünyada Ne Kazandırıyor?");
  });

  it("arama kategori etiketiyle de eşleşir: 'almanya' başlığında geçmeyen araçları da bulur", async () => {
    const user = userEvent.setup();
    renderHub();

    await user.type(screen.getByRole("searchbox", { name: "Araçlarda ara" }), "almanya");

    // Hiçbir başlıkta "Almanya" geçmiyor; eşleşme kategori etiketinden geliyor.
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("sonuç yoksa çıkmaz sokak değil: sorguyu gösterir ve tek tıkla tüm araçlara döner", async () => {
    const user = userEvent.setup();
    renderHub();

    await user.type(screen.getByRole("searchbox", { name: "Araçlarda ara" }), "kripto");

    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText(/"kripto".*bulunamadı/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tüm araçları göster" }));
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("yüklenirken iskelet gösterir, kart veya boş-durum metni göstermez", () => {
    renderHub({ tools: [], isLoading: true });

    expect(screen.getByRole("status")).toHaveTextContent("Yükleniyor…");
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryByText("Henüz aktif araç yok.")).not.toBeInTheDocument();
  });

  it("hata durumunda yeniden deneme sunar", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderHub({ tools: [], isError: true, onRetry });

    await user.click(screen.getByRole("button", { name: "Yeniden dene" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("kartlarda emoji ikon kullanmaz — rozetler SVG (ui-ux-pro-max teslim listesi)", () => {
    renderHub();

    // Eski tasarımdaki "🎉 Ücretsiz" rozeti kaldırıldı; ücretsizlik bilgisi hero'da bir kez veriliyor.
    expect(within(grid()).queryByText(/[\u{1F300}-\u{1FAFF}]/u)).not.toBeInTheDocument();
    expect(screen.getByText(/Tamamen ücretsiz/)).toBeInTheDocument();
  });

  it("soru sayısı olmayan araçta meta satırını boş bırakmaz", async () => {
    const user = userEvent.setup();
    renderHub();

    await user.click(screen.getByRole("button", { name: /Almanya\s*2/ }));

    expect(screen.getByRole("link", { name: /Vize Seçimi/ })).toHaveTextContent("Hemen dene");
    expect(screen.getByRole("link", { name: /Banka Seçimi/ })).toHaveTextContent("5 soru · birkaç dakika");
  });
});
