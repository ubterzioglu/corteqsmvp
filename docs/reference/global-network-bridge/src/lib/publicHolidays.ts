// Public holidays for countries the user is registered in.
// Fixed-date national / federal holidays only (no moving religious dates),
// covered for current + next calendar year. Used by profile panel calendars
// to surface holidays alongside followed/ticketed events.

type FixedHoliday = { md: string; name: string }; // md = "MM-DD"

const FIXED: Record<string, FixedHoliday[]> = {
  "Türkiye": [
    { md: "01-01", name: "Yılbaşı" },
    { md: "04-23", name: "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı" },
    { md: "05-01", name: "Emek ve Dayanışma Günü" },
    { md: "05-19", name: "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı" },
    { md: "07-15", name: "Demokrasi ve Milli Birlik Günü" },
    { md: "08-30", name: "30 Ağustos Zafer Bayramı" },
    { md: "10-29", name: "29 Ekim Cumhuriyet Bayramı" },
  ],
  "Almanya": [
    { md: "01-01", name: "Neujahr" },
    { md: "05-01", name: "Tag der Arbeit" },
    { md: "10-03", name: "Tag der Deutschen Einheit" },
    { md: "12-25", name: "Weihnachten" },
    { md: "12-26", name: "2. Weihnachtstag" },
  ],
  "Hollanda": [
    { md: "01-01", name: "Nieuwjaarsdag" },
    { md: "04-27", name: "Koningsdag" },
    { md: "05-05", name: "Bevrijdingsdag" },
    { md: "12-25", name: "Eerste Kerstdag" },
    { md: "12-26", name: "Tweede Kerstdag" },
  ],
  "Fransa": [
    { md: "01-01", name: "Jour de l'an" },
    { md: "05-01", name: "Fête du Travail" },
    { md: "05-08", name: "Victoire 1945" },
    { md: "07-14", name: "Fête nationale" },
    { md: "08-15", name: "Assomption" },
    { md: "11-01", name: "Toussaint" },
    { md: "11-11", name: "Armistice 1918" },
    { md: "12-25", name: "Noël" },
  ],
  "Birleşik Krallık": [
    { md: "01-01", name: "New Year's Day" },
    { md: "12-25", name: "Christmas Day" },
    { md: "12-26", name: "Boxing Day" },
  ],
  "Amerika Birleşik Devletleri": [
    { md: "01-01", name: "New Year's Day" },
    { md: "07-04", name: "Independence Day" },
    { md: "11-11", name: "Veterans Day" },
    { md: "12-25", name: "Christmas Day" },
  ],
  "Belçika": [
    { md: "01-01", name: "Nieuwjaar" },
    { md: "05-01", name: "Dag van de Arbeid" },
    { md: "07-21", name: "Nationale feestdag" },
    { md: "08-15", name: "Onze-Lieve-Vrouw-Hemelvaart" },
    { md: "11-01", name: "Allerheiligen" },
    { md: "11-11", name: "Wapenstilstand" },
    { md: "12-25", name: "Kerstmis" },
  ],
  "İsviçre": [
    { md: "01-01", name: "Neujahr" },
    { md: "08-01", name: "Bundesfeier" },
    { md: "12-25", name: "Weihnachten" },
  ],
  "Avusturya": [
    { md: "01-01", name: "Neujahr" },
    { md: "05-01", name: "Staatsfeiertag" },
    { md: "10-26", name: "Nationalfeiertag" },
    { md: "12-25", name: "Christtag" },
    { md: "12-26", name: "Stefanitag" },
  ],
  "İsveç": [
    { md: "01-01", name: "Nyårsdagen" },
    { md: "05-01", name: "Första maj" },
    { md: "06-06", name: "Sveriges nationaldag" },
    { md: "12-25", name: "Juldagen" },
    { md: "12-26", name: "Annandag jul" },
  ],
  "Norveç": [
    { md: "01-01", name: "Første nyttårsdag" },
    { md: "05-01", name: "Arbeidernes dag" },
    { md: "05-17", name: "Grunnlovsdag" },
    { md: "12-25", name: "Første juledag" },
    { md: "12-26", name: "Andre juledag" },
  ],
  "Danimarka": [
    { md: "01-01", name: "Nytårsdag" },
    { md: "06-05", name: "Grundlovsdag" },
    { md: "12-25", name: "Juledag" },
    { md: "12-26", name: "2. juledag" },
  ],
  "Kanada": [
    { md: "01-01", name: "New Year's Day" },
    { md: "07-01", name: "Canada Day" },
    { md: "11-11", name: "Remembrance Day" },
    { md: "12-25", name: "Christmas Day" },
    { md: "12-26", name: "Boxing Day" },
  ],
  "Avustralya": [
    { md: "01-01", name: "New Year's Day" },
    { md: "01-26", name: "Australia Day" },
    { md: "04-25", name: "Anzac Day" },
    { md: "12-25", name: "Christmas Day" },
    { md: "12-26", name: "Boxing Day" },
  ],
  "İspanya": [
    { md: "01-01", name: "Año Nuevo" },
    { md: "05-01", name: "Día del Trabajo" },
    { md: "10-12", name: "Fiesta Nacional" },
    { md: "12-06", name: "Día de la Constitución" },
    { md: "12-25", name: "Navidad" },
  ],
  "İtalya": [
    { md: "01-01", name: "Capodanno" },
    { md: "04-25", name: "Festa della Liberazione" },
    { md: "05-01", name: "Festa del Lavoro" },
    { md: "06-02", name: "Festa della Repubblica" },
    { md: "08-15", name: "Ferragosto" },
    { md: "12-25", name: "Natale" },
    { md: "12-26", name: "Santo Stefano" },
  ],
};

export interface HolidayEvent {
  id: string;
  date: Date;
  name: string;
  country: string;
}

const yearsToCover = (): number[] => {
  const y = new Date().getFullYear();
  return [y, y + 1];
};

/**
 * Returns upcoming + recent (last 90 days) public holidays for the given
 * countries. Unknown countries are silently skipped.
 */
export function getHolidaysForCountries(countries: string[]): HolidayEvent[] {
  if (!countries || countries.length === 0) return [];
  const uniq = Array.from(new Set(countries.filter(Boolean)));
  const out: HolidayEvent[] = [];
  for (const country of uniq) {
    const list = FIXED[country];
    if (!list) continue;
    for (const year of yearsToCover()) {
      for (const h of list) {
        const [m, d] = h.md.split("-").map(Number);
        out.push({
          id: `holiday-${country}-${year}-${h.md}`,
          date: new Date(year, m - 1, d),
          name: h.name,
          country,
        });
      }
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export const supportedHolidayCountries = (): string[] => Object.keys(FIXED);
