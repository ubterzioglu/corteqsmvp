// Tool verifier (Faz 4) — yürütme öncesi şema + güvenlik politikası denetimi.
// Kaynak tasarım: newtools.md §"Ajan orkestrasyonu ve API sözleşmeleri" güvenlik.
//
// Verifier executor'dan ÖNCE çalışır: uydurma cevap yerine açık red döner.
// İlkeler: allowlist (yalnız active), idempotency zorunluluğu (mutasyon),
// payload alan doğrulaması, redaction gerekliliği işareti.

export type VerifyToolMeta = {
  tool_key: string;
  status: string;
  family: string;
  input_schema?: { validation?: string; fields?: string[] };
};

export type VerifyRequest = {
  tool: VerifyToolMeta;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  /** Mutasyon mu (mail gönderme, state yazma)? Idempotency zorunlu olur. */
  mutating?: boolean;
  /** Payload serbest metin içeriyorsa redaction yapıldı mı? */
  redacted?: boolean;
  /** İstenen zorunlu alanlar (OpenAPI REQUIRED_HINTS ile uyumlu). */
  requiredFields?: string[];
};

export type VerifyResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * Bir araç çağrısını yürütmeden önce doğrular.
 * ok=false ise executor çağrıyı reddetmeli (uydurma cevap üretmemeli).
 */
export function verifyToolCall(req: VerifyRequest): VerifyResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1) Allowlist / status gate — deprecated veya unknown çağrılamaz.
  if (req.tool.status !== "active") {
    errors.push(
      `Araç çağrılamaz: status="${req.tool.status}" (yalnız "active" araçlar çalıştırılır).`,
    );
  }

  // 2) Zorunlu alan doğrulaması.
  for (const field of req.requiredFields ?? []) {
    const value = req.payload?.[field];
    if (value === undefined || value === null || value === "") {
      errors.push(`Zorunlu alan eksik: "${field}".`);
    }
  }

  // 3) Idempotency zorunluluğu — mutasyon işlemlerinde anahtar şart.
  if (req.mutating && !req.idempotencyKey) {
    errors.push(
      "Mutasyon işlemi idempotency-key olmadan çalıştırılamaz (çift işlem riski).",
    );
  }

  // 4) Redaction gerekliliği — manual-validation araçlarda serbest metin riski.
  const usesZod = req.tool.input_schema?.validation === "zod";
  if (!usesZod && req.redacted === false) {
    warnings.push(
      "Araç şema-dışı doğrulama kullanıyor ve payload redakte edilmemiş — PII sızıntı riski.",
    );
  }

  // 5) Bilinmeyen alan uyarısı (katalog şemasıyla karşılaştır).
  const known = new Set(req.tool.input_schema?.fields ?? []);
  if (known.size > 0) {
    for (const key of Object.keys(req.payload ?? {})) {
      if (!known.has(key)) {
        warnings.push(`Beklenmeyen alan: "${key}" (katalog şemasında yok).`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
