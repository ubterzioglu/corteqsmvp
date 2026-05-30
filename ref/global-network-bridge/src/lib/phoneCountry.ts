// Maps E.164 dialing codes (longest match first) to country names used in
// src/data/countryCities.ts. Used to auto-populate the user's "lived country"
// from the phone number's country code on profile setup.

const MAP: Array<[string, string]> = [
  // 3-4 digit codes first (longest match wins)
  ["971", "BAE"],
  ["973", "Bahreyn"],
  ["974", "Katar"],
  ["965", "Kuveyt"],
  ["968", "Umman"],
  ["962", "Ürdün"],
  ["961", "Lübnan"],
  ["972", "İsrail"],
  ["970", "Filistin"],
  ["966", "Suudi Arabistan"],
  ["964", "Irak"],
  ["963", "Suriye"],
  ["994", "Azerbaycan"],
  ["995", "Gürcistan"],
  ["374", "Ermenistan"],
  ["996", "Kırgızistan"],
  ["998", "Özbekistan"],
  ["992", "Tacikistan"],
  ["993", "Türkmenistan"],
  ["375", "Belarus"],
  ["380", "Ukrayna"],
  ["370", "Litvanya"],
  ["371", "Letonya"],
  ["372", "Estonya"],
  ["358", "Finlandiya"],
  ["354", "İzlanda"],
  ["353", "İrlanda"],
  ["351", "Portekiz"],
  ["352", "Lüksemburg"],
  ["356", "Malta"],
  ["357", "KKTC"],
  ["359", "Bulgaristan"],
  ["385", "Hırvatistan"],
  ["386", "Slovenya"],
  ["387", "Bosna Hersek"],
  ["389", "Kuzey Makedonya"],
  ["381", "Sırbistan"],
  ["382", "Karadağ"],
  ["383", "Kosova"],
  ["355", "Arnavutluk"],
  ["420", "Çekya"],
  ["421", "Slovakya"],
  ["852", "Hong Kong"],
  ["853", "Makao"],
  ["886", "Tayvan"],
  ["880", "Bangladeş"],
  ["977", "Nepal"],
  ["960", "Maldivler"],
  ["975", "Bhutan"],
  // 2-digit codes
  ["49", "Almanya"],
  ["44", "İngiltere"],
  ["31", "Hollanda"],
  ["33", "Fransa"],
  ["43", "Avusturya"],
  ["41", "İsviçre"],
  ["34", "İspanya"],
  ["39", "İtalya"],
  ["30", "Yunanistan"],
  ["46", "İsveç"],
  ["47", "Norveç"],
  ["45", "Danimarka"],
  ["32", "Belçika"],
  ["48", "Polonya"],
  ["36", "Macaristan"],
  ["40", "Romanya"],
  ["90", "Türkiye"],
  ["98", "İran"],
  ["91", "Hindistan"],
  ["92", "Pakistan"],
  ["94", "Sri Lanka"],
  ["86", "Çin"],
  ["81", "Japonya"],
  ["82", "Güney Kore"],
  ["84", "Vietnam"],
  ["66", "Tayland"],
  ["65", "Singapur"],
  ["60", "Malezya"],
  ["62", "Endonezya"],
  ["63", "Filipinler"],
  ["52", "Meksika"],
  ["55", "Brezilya"],
  ["54", "Arjantin"],
  ["56", "Şili"],
  ["27", "Güney Afrika"],
  ["20", "Mısır"],
  ["61", "Avustralya"],
  ["64", "Yeni Zelanda"],
  ["7", "Rusya"],
  // 1-digit
  ["1", "ABD"],
];

export function countryFromPhone(phoneRaw: string): string | null {
  if (!phoneRaw) return null;
  const digits = phoneRaw.replace(/[^\d+]/g, "");
  const stripped = digits.startsWith("+")
    ? digits.slice(1)
    : digits.startsWith("00")
      ? digits.slice(2)
      : digits;
  if (!stripped) return null;
  for (const [code, country] of MAP) {
    if (stripped.startsWith(code)) return country;
  }
  return null;
}
