// Lightweight content moderation for cafe names.
// Rejects political party names, religious terms, slurs, profanity and the
// names of well-known leaders/figures (TR + global) to keep the community safe.

const FORBIDDEN_PATTERNS: RegExp[] = [
  // Profanity / slurs (TR + intl., partial list — case-insensitive)
  /\b(amk|aq|amına|orospu|piç|göt|sik|yarra|pezevenk|kahpe|ibne|puşt|ş[ie]rfes[ıi]z)\b/i,
  /\b(fuck|shit|bitch|asshole|cunt|nigger|faggot)\b/i,

  // Religion / sect references
  /\b(islam|müslüman|musluman|hristiyan|christian|yahudi|jewish|musevi|alevi|sünni|sunni|şii|shia|ateist|atheist|deist|kâfir|kafir|gavur|tanrı|allah|jesus|isa|muhammed|buda|hindu)\b/i,
  /\b(cami|mosque|kilise|church|sinagog|synagogue|tarikat|cemaat|tarık|fethullah|gülen|gulen)\b/i,

  // Political parties (TR + intl.)
  /\b(akp|chp|mhp|hdp|iyi parti|iyip|tip|dem parti|saadet|deva|gelecek|zafer partisi|memleket partisi|vatan partisi|bbp|hüda par|huda par)\b/i,
  /\b(cumhuriyet halk|adalet ve kalkınma|milliyetçi hareket|halkların demokratik|büyük birlik)\b/i,
  /\b(republican|democrat|gop|labour|tory|conservative|afd|spd|cdu|csu|fdp|grünen|gruenen|fpö|fpoe|öVP|ovp)\b/i,

  // Leaders / political figures (TR + intl., common forms)
  /\b(erdoğan|erdogan|kılıçdaroğlu|kilicdaroglu|bahçeli|bahceli|imamoğlu|imamoglu|davutoğlu|davutoglu|babacan|akşener|aksener|özel\b|atatürk|ataturk|inönü|inonu|menderes|özal|ozal|demirel|ecevit)\b/i,
  /\b(trump|biden|obama|putin|xi jinping|netanyahu|merkel|macron|orban|orbán|le pen|meloni|sunak|starmer|modi|zelensky)\b/i,

  // Hate / extremism / terror groups
  /\b(nazi|hitler|mussolini|stalin|isis|işid|isid|pkk|pyd|fetö|feto|deaş|deas|taliban|hamas|hizbullah|hezbollah|kkk|ku klux|white power|whitepower|sieg heil|heil hitler|14\/?88|14 88)\b/i,

  // Racism / ethnic slurs / hate speech
  /\b(zenci|ç[ıi]ng[ée]ne|kıro|kiro|ırkç[ıi]|irkci|ırkçılık|irkcilik|faşist|fasist|fascist|faşizm|fasizm|soyk[ıi]r[ıi]m|genocide|aşağ[ıi] ırk|asagi irk|üstün ırk|ustun irk|öjeni|eugenics)\b/i,
  /\b(nigger|nigga|chink|gook|spic|kike|wetback|towelhead|sandnigger|paki|coon|jigaboo|raghead)\b/i,
  /\b(k[üu]rtler defolun|t[üu]rkler defolun|araplar defolun|ermeniler defolun|yahudiler defolun|suriyeliler defolun|g[öo]çmenler defolun|gocmenler defolun)\b/i,
];

export type CafeNameModerationResult =
  | { ok: true }
  | { ok: false; reason: string };

export const moderateCafeName = (raw: string): CafeNameModerationResult => {
  const name = (raw || "").trim();
  if (!name) return { ok: false, reason: "Cafe adı boş olamaz." };
  if (name.length < 2) return { ok: false, reason: "Cafe adı çok kısa." };

  for (const re of FORBIDDEN_PATTERNS) {
    if (re.test(name)) {
      return {
        ok: false,
        reason:
          "Topluluk kurallarına aykırı: küfür, siyaset, ırkçılık ve nefret söylemi içeren cafe adlarına izin verilmiyor.",
      };
    }
  }
  return { ok: true };
};
