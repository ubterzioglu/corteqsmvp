export function reportErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("rl_report_location_required")) {
    return "Rapor için profilde ülke ve şehir bilgisi gerekli.";
  }
  if (message.includes("rl_report_verified_email_required")) {
    return "Rapor için doğrulanmış bir e-posta adresi gerekli.";
  }
  if (message.includes("rl_report_rate_limited")) {
    return "24 saatlik rapor gönderim sınırına ulaştın.";
  }
  return "Rapor kuyruğa alınamadı. Biraz sonra yeniden dene.";
}
