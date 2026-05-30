import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck } from "lucide-react";

export interface ConsentState {
  privacy: boolean;        // Privacy Policy + KVKK + GDPR + CCPA + APP + PIPEDA
  terms: boolean;          // Terms of Service
  marketing: boolean;      // Optional marketing
  dataProcessing: boolean; // Specific consent to processing of personal data
}

export const emptyConsent: ConsentState = {
  privacy: false,
  terms: false,
  marketing: false,
  dataProcessing: false,
};

export const isConsentValid = (c: ConsentState) => c.privacy && c.terms && c.dataProcessing;

interface Props {
  value?: ConsentState;
  onChange?: (c: ConsentState) => void;
  /** Compact mode (single combined consent) for inline forms */
  compact?: boolean;
  /** Hide marketing opt-in (e.g. for non-account forms) */
  hideMarketing?: boolean;
  className?: string;
}

/**
 * Multi-jurisdictional consent block.
 *
 * Covers:
 *  - 🇹🇷 KVKK (Türkiye - Law No. 6698)
 *  - 🇪🇺 GDPR (EU Regulation 2016/679)
 *  - 🇬🇧 UK GDPR & Data Protection Act 2018
 *  - 🇺🇸 CCPA / CPRA (California)
 *  - 🇨🇦 PIPEDA (Canada)
 *  - 🇦🇺 Australian Privacy Act 1988 / APPs
 *  - 🇨🇭 nFADP (Switzerland)
 *  - 🇧🇷 LGPD (Brazil)
 *
 * Two checkboxes are mandatory (privacy + terms + dataProcessing),
 * marketing is optional (opt-in, default false).
 */
const ConsentCheckboxes = ({
  value,
  onChange,
  compact = false,
  hideMarketing = false,
  className = "",
}: Props) => {
  const [internal, setInternal] = useState<ConsentState>(value || emptyConsent);

  useEffect(() => {
    if (value) setInternal(value);
  }, [value]);

  const update = (patch: Partial<ConsentState>) => {
    const next = { ...internal, ...patch };
    setInternal(next);
    onChange?.(next);
  };

  if (compact) {
    return (
      <div className={`rounded-lg border border-border bg-muted/30 p-3 space-y-2 ${className}`}>
        <label className="flex items-start gap-2 cursor-pointer text-xs leading-relaxed">
          <Checkbox
            checked={internal.privacy && internal.terms && internal.dataProcessing}
            onCheckedChange={(v) =>
              update({ privacy: !!v, terms: !!v, dataProcessing: !!v })
            }
            className="mt-0.5"
          />
          <span className="text-foreground">
            <ShieldCheck className="inline h-3 w-3 text-primary mr-1" />
            <Link to="/legal/privacy" target="_blank" className="underline hover:text-primary">
              Gizlilik Politikası
            </Link>
            ,{" "}
            <Link to="/legal/terms" target="_blank" className="underline hover:text-primary">
              Kullanım Şartları
            </Link>{" "}
            ve{" "}
            <Link to="/legal/kvkk" target="_blank" className="underline hover:text-primary">
              KVKK / GDPR Aydınlatma Metni
            </Link>
            'ni okudum, anladım ve kişisel verilerimin işlenmesine{" "}
            <span className="font-semibold">açık rıza</span> veriyorum. *
          </span>
        </label>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-muted/30 p-4 space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Yasal Onaylar / Legal Consents
      </div>

      {/* 1. Privacy Policy / KVKK / GDPR */}
      <label className="flex items-start gap-2 cursor-pointer text-xs leading-relaxed">
        <Checkbox
          checked={internal.privacy}
          onCheckedChange={(v) => update({ privacy: !!v })}
          className="mt-0.5"
        />
        <span className="text-foreground">
          <Link to="/legal/privacy" target="_blank" className="underline hover:text-primary font-medium">
            Gizlilik Politikası
          </Link>
          'nı ve{" "}
          <Link to="/legal/kvkk" target="_blank" className="underline hover:text-primary font-medium">
            KVKK / GDPR / CCPA Aydınlatma Metni
          </Link>
          'ni okudum, anladım. *
          <br />
          <span className="text-[10px] text-muted-foreground">
            (TR: 6698 sayılı Kanun · EU: GDPR 2016/679 · UK: DPA 2018 · US: CCPA/CPRA · CA: PIPEDA · AU: Privacy Act 1988 · CH: nFADP · BR: LGPD)
          </span>
        </span>
      </label>

      {/* 2. Terms of Service */}
      <label className="flex items-start gap-2 cursor-pointer text-xs leading-relaxed">
        <Checkbox
          checked={internal.terms}
          onCheckedChange={(v) => update({ terms: !!v })}
          className="mt-0.5"
        />
        <span className="text-foreground">
          <Link to="/legal/terms" target="_blank" className="underline hover:text-primary font-medium">
            Kullanım Şartları
          </Link>
          'nı kabul ediyorum. *
        </span>
      </label>

      {/* 3. Explicit Data Processing Consent */}
      <label className="flex items-start gap-2 cursor-pointer text-xs leading-relaxed">
        <Checkbox
          checked={internal.dataProcessing}
          onCheckedChange={(v) => update({ dataProcessing: !!v })}
          className="mt-0.5"
        />
        <span className="text-foreground">
          Kişisel verilerimin (ad, e-posta, telefon, konum, yüklenen belgeler vb.) CorteQS
          tarafından platform hizmetlerinin sunulması, eşleştirme, iletişim ve yasal yükümlülüklerin
          yerine getirilmesi amacıyla işlenmesine{" "}
          <span className="font-semibold">açık rıza</span> veriyorum. *
          <br />
          <span className="text-[10px] text-muted-foreground">
            Verileriniz AB / İsviçre / Türkiye sunucularında saklanır. İstediğiniz zaman{" "}
            <Link to="/legal/privacy#rights" target="_blank" className="underline">
              haklarınızı
            </Link>{" "}
            kullanabilirsiniz.
          </span>
        </span>
      </label>

      {/* 4. Marketing (optional) */}
      {!hideMarketing && (
        <label className="flex items-start gap-2 cursor-pointer text-xs leading-relaxed">
          <Checkbox
            checked={internal.marketing}
            onCheckedChange={(v) => update({ marketing: !!v })}
            className="mt-0.5"
          />
          <span className="text-muted-foreground">
            (Opsiyonel) CorteQS'ten kampanya, etkinlik ve ürün güncellemeleri içeren ticari
            elektronik iletiler (e-posta / SMS / WhatsApp) almayı kabul ediyorum. Her zaman
            ücretsiz olarak iletiyi durdurabilirim.
          </span>
        </label>
      )}

      <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
        * işaretli alanlar zorunludur. Onayınızı dilediğiniz zaman{" "}
        <Link to="/profile" className="underline">profil</Link>'inizden geri çekebilirsiniz.
        İletişim:{" "}
        <a href="mailto:info@corteqs.net" className="underline">info@corteqs.net</a>
      </p>
    </div>
  );
};

export default ConsentCheckboxes;
