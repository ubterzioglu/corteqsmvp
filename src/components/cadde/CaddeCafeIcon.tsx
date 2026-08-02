// Corteqs kafe ikonu (workshop m3 — seçilen: Varyant 3 · İnce Belli Çay Bardağı).
// Kaynak: docs/cadde-300/kafe-ikon-onerileri.html — 5 varyanttan kullanıcı seçimi (2026-08-02).
// Neden çay bardağı: kulpsuz/buharsız tulip silueti diaspora kimliğine göz kırpar ve
// lucide Coffee'nin yandan-kupa formundan anında ayrışır; kafe kartları yalnız bu
// küçük ikondan tanınır (m3'ün amacı). Lucide sözleşmesi: 24×24 viewBox, stroke 2,
// currentColor, round cap/join — className ile lucide ikonları gibi boyutlanır/renklenir.

interface CaddeCafeIconProps {
  className?: string;
}

const CaddeCafeIcon = ({ className }: CaddeCafeIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
    focusable="false"
    data-testid="cadde-cafe-icon"
  >
    <path d="M6 3 C6.5 7 8.75 8 8.75 10.5 C8.75 13 8.25 13.5 8.25 17 L15.75 17 C15.75 13.5 15.25 13 15.25 10.5 C15.25 8 17.5 7 18 3 Z" />
    <path d="M5 21c2 1.5 12 1.5 14 0" />
  </svg>
);

export default CaddeCafeIcon;
