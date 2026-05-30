export function normalizeTurkishText(input: string): string {
  const withoutControlChars = input
    .normalize("NFC")
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      return !(code <= 31 || code === 127);
    })
    .join("");

  return withoutControlChars.trim();
}

export function normalizeOptionalTurkishText(input: string | null | undefined): string | null {
  if (input == null) return null;
  const normalized = normalizeTurkishText(input);
  return normalized === "" ? null : normalized;
}
