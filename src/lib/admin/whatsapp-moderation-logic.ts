// WhatsApp topluluk moderasyonunun SAF mantığı (C04).
//
// Bileşen 594 satırdı, 7 `useState` taşıyordu ve HİÇ testi yoktu. Repo kuralı testsiz
// ayrıştırmayı yasaklıyor; React'tan bağımsız çalışabilen parçalar önce buraya taşındı.
//
// ⚠️ Buraya yalnız SAF şey girer: sözlük, biçimlendirici, kural. State ve Supabase
// çağrısı bileşende kalır.

import type { LandingCategoryInput, LandingStatus } from "@/lib/whatsapp-landings";

export const LANDING_STATUS_BADGE_CLASS: Record<LandingStatus, string> = {
  pending: "border-amber-200 bg-amber-100 text-amber-800",
  approved: "border-emerald-200 bg-emerald-100 text-emerald-800",
  rejected: "border-rose-200 bg-rose-100 text-rose-800",
};

export const LANDING_STATUS_LABEL: Record<LandingStatus, string> = {
  pending: "Beklemede",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

// Liste 'girisim' takma adını da sunuyor (kaydederken 'yatirim'a çevrilir),
// bu yüzden kanonik LandingCategory değil girdi tipi kullanılır.
export const LANDING_CATEGORY_OPTIONS: Array<{ value: LandingCategoryInput; label: string }> = [
  { value: "alumni", label: "Alumni" },
  { value: "hobi", label: "Hobi" },
  { value: "is", label: "İş Grubu" },
  { value: "doktor", label: "Doktor / Sağlık" },
  { value: "yatirim", label: "Yatırım" },
  { value: "girisim", label: "Girişim" },
  { value: "akademik", label: "Akademik" },
  { value: "dayanisma", label: "Dayanışma" },
  { value: "diger", label: "Diğer" },
];

/** Onay seçimi: üye ve yönetici BİRBİRİNİ DIŞLAR, ikisi birden açık olamaz. */
export type ApprovalChoice = "member" | "admin" | "none";

/**
 * Onay seçimini iki bayrağa çevirir.
 *
 * ⚠️ Kural tek yönlü değil: "üye"yi seçmek yöneticiyi TEMİZLEMELİ. Bileşende bu
 * elle yazılıyordu; biri unutulursa kayıt hem üye hem yönetici onaylı görünür ve
 * bu, listede iki ayrı rozet çizdirdiği için gözden kaçar.
 */
export function approvalFlagsFor(choice: ApprovalChoice): {
  memberApproved: boolean;
  adminApproved: boolean;
} {
  return {
    memberApproved: choice === "member",
    adminApproved: choice === "admin",
  };
}

/**
 * Yönetici iletişim bilgisini tek metne toplar.
 *
 * ⚠️ Boş alan SATIR AÇMAZ: eskiden `filter(Boolean)` ile eleniyordu ama bu davranış
 * hiçbir yerde yazılı değildi. Boş bırakılan telefon yüzünden kayda "Telefon: "
 * diye yarım bir satır düşmesi, listede kırık görünen bir alan üretirdi.
 */
export function buildAdminContact(input: { email: string; phone: string }): string {
  return [
    input.email.trim() ? `E-posta: ${input.email.trim()}` : "",
    input.phone.trim() ? `Telefon: ${input.phone.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Satır kimliğinden platform etiketine harita; boş platform "Belirtilmedi" olur. */
export function platformLabelsByRowId(
  rows: ReadonlyArray<{ id: string; dbId?: string | null; platform?: string | null }>,
): Record<string, string> {
  return rows.reduce<Record<string, string>>((accumulator, row) => {
    accumulator[row.dbId ?? row.id] = row.platform?.trim() || "Belirtilmedi";
    return accumulator;
  }, {});
}
