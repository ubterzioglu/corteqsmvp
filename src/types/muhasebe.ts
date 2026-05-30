// src/types/muhasebe.ts
// CorteQS Muhasebe Modülü — Domain tipleri

export type ExpenseCategory =
  | 'yazilim_araclar'
  | 'hosting_sunucu'
  | 'alan_adi_ssl'
  | 'pazarlama_reklam'
  | 'hukuki_danismanlik'
  | 'muhasebe_finans'
  | 'seyahat_ulasim'
  | 'ofis_kirtasiye'
  | 'maas_ucret'
  | 'esop_hisse'
  | 'banka_komisyon'
  | 'diger_gider';

export type IncomeCategory =
  | 'pilot_gelir'
  | 'danismanlik_geliri'
  | 'hibe_grant'
  | 'yatirim_taahhudu'
  | 'demo_geliri'
  | 'diger_gelir';

export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'QAR';

export type ExpenseStatus = 'odendi' | 'bekliyor' | 'iptal';
export type IncomeStatus = 'tahsil_edildi' | 'bekliyor' | 'iptal';

export type PaymentMethod =
  | 'sanal_kart_burak'
  | 'sanal_kart_baris'
  | 'kisisel_kart_burak'
  | 'kisisel_kart_baris'
  | 'havale_eft'
  | 'nakit'
  | 'diger';

export type PersonType = 'burak' | 'baris' | 'ortak';

export const CURRENCY_CODES = ['TRY', 'USD', 'EUR', 'GBP', 'QAR'] as const;
export type CurrencyTotals = Record<CurrencyCode, number>;

// ---------------------------------------------------------------------
// DB Row tipleri (supabase tablo şemasıyla birebir)
// ---------------------------------------------------------------------

export interface ExpenseRow {
  id: string;
  expense_date: string; // ISO date (YYYY-MM-DD)
  person: PersonType;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: CurrencyCode;
  status: ExpenseStatus;
  payment_method: PaymentMethod | null;
  invoice_url: string | null;
  note: string | null;
  is_virtual_card: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface IncomeRow {
  id: string;
  income_date: string;
  source: string;
  category: IncomeCategory;
  description: string;
  amount: number;
  currency: CurrencyCode;
  status: IncomeStatus;
  link: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Form payload tipleri (id/created_at vs. olmayan)
export type ExpenseInput = Omit<
  ExpenseRow,
  'id' | 'created_at' | 'updated_at' | 'created_by'
>;

export type IncomeInput = Omit<
  IncomeRow,
  'id' | 'created_at' | 'updated_at' | 'created_by'
>;

// ---------------------------------------------------------------------
// View tipleri (Dashboard)
// ---------------------------------------------------------------------

export interface KpiSummary {
  total_expense_try: number;
  total_income_try: number;
  net_position_try: number;
  pending_expense_try: number;
  pending_income_try: number;
  total_records: number;
}

export interface PersonSummary {
  person: PersonType;
  record_count: number;
  total_try: number;
  paid_try: number;
  pending_try: number;
}

export interface CategorySummary {
  category: ExpenseCategory;
  record_count: number;
  total_try: number;
}

export interface CashflowMonth {
  year_num: number;
  month_num: number;
  income_try: number;
  expense_try: number;
  net_try: number;
  burak_try: number;
  baris_try: number;
  ortak_try: number;
  expense_paid_try: number;
  expense_pending_try: number;
  income_collected_try: number;
  income_pending_try: number;
}

export interface MuhasebeKpiSummary {
  total_expense_by_currency: CurrencyTotals;
  total_income_by_currency: CurrencyTotals;
  net_by_currency: CurrencyTotals;
  pending_expense_by_currency: CurrencyTotals;
  pending_income_by_currency: CurrencyTotals;
  total_records: number;
}

export interface PersonSummaryByCurrency {
  person: PersonType;
  record_count: number;
  total_by_currency: CurrencyTotals;
  paid_by_currency: CurrencyTotals;
  pending_by_currency: CurrencyTotals;
}

export interface CategorySummaryByCurrency {
  category: ExpenseCategory;
  record_count: number;
  total_by_currency: CurrencyTotals;
}

export interface CashflowMonthByCurrency {
  year_num: number;
  month_num: number;
  income_by_currency: CurrencyTotals;
  expense_by_currency: CurrencyTotals;
  net_by_currency: CurrencyTotals;
  burak_expense_by_currency: CurrencyTotals;
  baris_expense_by_currency: CurrencyTotals;
  ortak_expense_by_currency: CurrencyTotals;
  expense_paid_by_currency: CurrencyTotals;
  expense_pending_by_currency: CurrencyTotals;
  income_collected_by_currency: CurrencyTotals;
  income_pending_by_currency: CurrencyTotals;
}

// ---------------------------------------------------------------------
// LABEL MAP'LERİ (Excel'deki TR metinleri birebir koruyor)
// ---------------------------------------------------------------------

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  yazilim_araclar: 'Yazılım & Araçlar',
  hosting_sunucu: 'Hosting & Sunucu',
  alan_adi_ssl: 'Alan Adı & SSL',
  pazarlama_reklam: 'Pazarlama & Reklam',
  hukuki_danismanlik: 'Hukuki & Danışmanlık',
  muhasebe_finans: 'Muhasebe & Finans',
  seyahat_ulasim: 'Seyahat & Ulaşım',
  ofis_kirtasiye: 'Ofis & Kırtasiye',
  maas_ucret: 'Maaş & Ücret',
  esop_hisse: 'ESOP & Hisse',
  banka_komisyon: 'Banka & Komisyon',
  diger_gider: 'Diğer Gider',
};

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  pilot_gelir: 'Pilot Gelir',
  danismanlik_geliri: 'Danışmanlık Geliri',
  hibe_grant: 'Hibe & Grant',
  yatirim_taahhudu: 'Yatırım Taahhüdü',
  demo_geliri: 'Demo Geliri',
  diger_gelir: 'Diğer Gelir',
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  odendi: 'Ödendi',
  bekliyor: 'Bekliyor',
  iptal: 'İptal',
};

export const INCOME_STATUS_LABELS: Record<IncomeStatus, string> = {
  tahsil_edildi: 'Tahsil Edildi',
  bekliyor: 'Bekliyor',
  iptal: 'İptal',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  sanal_kart_burak: 'Sanal Kart - Burak',
  sanal_kart_baris: 'Sanal Kart - Barış',
  kisisel_kart_burak: 'Kişisel Kart - Burak',
  kisisel_kart_baris: 'Kişisel Kart - Barış',
  havale_eft: 'Havale / EFT',
  nakit: 'Nakit',
  diger: 'Diğer',
};

export const PERSON_LABELS: Record<PersonType, string> = {
  burak: 'Burak',
  baris: 'Barış',
  ortak: 'Ortak',
};

export const MONTH_LABELS_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
] as const;

// Tatlı renk skalası, kategori dağılım grafikleri için
export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#64748b',
];
