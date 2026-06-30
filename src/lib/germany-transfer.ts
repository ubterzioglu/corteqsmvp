// Para Transferi (Almanya→Türkiye) — sağlayıcı maliyet karşılaştırması (saf, test edilebilir).
// Kaynak: ref101/app/(site)/para-transferi/ParaTransferiClient.tsx — hesap mantığı BİREBİR.
// Verilen EUR tutarı için her sağlayıcının ücreti + kur marjı hesaplanır, net TL'ye göre sıralanır.
// NOT: EXCHANGE_RATE ve ücretler örnek/bilgilendirme amaçlıdır; transferden önce güncel değer kontrol edilmeli.

export type FeeType = "fixed" | "percentage" | "hybrid";

export interface TransferProvider {
  id: string;
  name: string;
  logo: string;
  feeType: FeeType;
  fixedFee: number;
  percentageFee: number;
  minFee: number;
  exchangeRateMargin: number; // yüzde (kur marjı)
  transferTime: string;
  rating: number;
  features: string[];
}

/** Örnek referans kur (1 EUR = X TRY). Gerçek transferden önce güncel kura bakılmalı. */
export const TRANSFER_EXCHANGE_RATE = 0.032;

export const TRANSFER_PROVIDERS: TransferProvider[] = [
  {
    id: "wise", name: "Wise", logo: "💰", feeType: "percentage",
    fixedFee: 0.5, percentageFee: 0.5, minFee: 0.5, exchangeRateMargin: 0.5,
    transferTime: "1-2 iş günü", rating: 4.8,
    features: ["Düşük ücretler", "Şeffaf kur", "Hızlı transfer", "Mobil uygulama"],
  },
  {
    id: "remitly", name: "Remitly", logo: "🌍", feeType: "hybrid",
    fixedFee: 1.99, percentageFee: 1.5, minFee: 1.99, exchangeRateMargin: 1.0,
    transferTime: "1-3 iş günü", rating: 4.7,
    features: ["Hızlı transfer", "Promosyonlar", "Mobil uygulama", "7/24 destek"],
  },
  {
    id: "western-union", name: "Western Union", logo: "🔗", feeType: "hybrid",
    fixedFee: 2.99, percentageFee: 2.0, minFee: 2.99, exchangeRateMargin: 1.5,
    transferTime: "1-3 iş günü", rating: 4.5,
    features: ["Geniş ağ", "Nakit teslimat", "Anında transfer", "Global"],
  },
  {
    id: "moneygram", name: "MoneyGram", logo: "💵", feeType: "hybrid",
    fixedFee: 2.99, percentageFee: 2.0, minFee: 2.99, exchangeRateMargin: 1.5,
    transferTime: "1-3 iş günü", rating: 4.4,
    features: ["Nakit teslimat", "Hızlı transfer", "Global ağ", "Mobil uygulama"],
  },
  {
    id: "xe", name: "XE Money Transfer", logo: "📊", feeType: "percentage",
    fixedFee: 0, percentageFee: 0.5, minFee: 0, exchangeRateMargin: 0.5,
    transferTime: "1-2 iş günü", rating: 4.6,
    features: ["Şeffaf kur", "Düşük ücretler", "Kur takibi", "Mobil uygulama"],
  },
  {
    id: "revolut", name: "Revolut", logo: "🏦", feeType: "percentage",
    fixedFee: 0, percentageFee: 0.5, minFee: 0, exchangeRateMargin: 0.5,
    transferTime: "1-2 iş günü", rating: 4.7,
    features: ["Şeffaf kur", "Düşük ücretler", "Mobil uygulama", "Kart"],
  },
];

export interface TransferQuote {
  fee: number;
  exchangeRate: number;
  receivedAmount: number;
  effectiveRate: number;
}

/** Bir sağlayıcı için ücret + kur sonrası net alınan TL. SQL/UI yok; saf hesap. */
export function quoteTransfer(provider: TransferProvider, amount: number): TransferQuote {
  let fee = 0;
  if (provider.feeType === "fixed") {
    fee = provider.fixedFee;
  } else if (provider.feeType === "percentage") {
    fee = Math.max(amount * (provider.percentageFee / 100), provider.minFee);
  } else {
    fee = Math.max(provider.fixedFee + amount * (provider.percentageFee / 100), provider.minFee);
  }

  const exchangeRate = TRANSFER_EXCHANGE_RATE * (1 - provider.exchangeRateMargin / 100);
  const receivedAmount = (amount - fee) * exchangeRate;

  return {
    fee,
    exchangeRate,
    receivedAmount,
    effectiveRate: amount > 0 ? receivedAmount / amount : 0,
  };
}

export interface RankedTransfer extends TransferProvider, TransferQuote {}

/** Tüm sağlayıcıları net alınan TL'ye göre (yüksekten düşüğe) sıralar. */
export function rankTransfers(amount: number): RankedTransfer[] {
  return TRANSFER_PROVIDERS.map((p) => ({ ...p, ...quoteTransfer(p, amount) })).sort(
    (a, b) => b.receivedAmount - a.receivedAmount,
  );
}
