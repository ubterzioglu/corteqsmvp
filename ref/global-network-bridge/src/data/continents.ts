// Continent → countries map. Country names match keys in countryCities.ts.
// Used by the Feed multi-country filter to allow whole-continent scoping.
export const continents: Record<string, string[]> = {
  "Avrupa": [
    "Almanya","İngiltere","Hollanda","Fransa","Avusturya","İsviçre","İspanya","İtalya",
    "Yunanistan","İsveç","Norveç","Finlandiya","Danimarka","Belçika","Portekiz","İrlanda",
    "Polonya","Çekya","Macaristan","Romanya","Bulgaristan","Sırbistan","Hırvatistan",
    "Slovenya","Slovakya","Bosna Hersek","Karadağ","Kuzey Makedonya","Arnavutluk","Kosova",
    "Ukrayna","Rusya","Litvanya","Letonya","Estonya","Türkiye","KKTC","Lüksemburg","Malta","İzlanda",
  ],
  "Orta Doğu": [
    "BAE","Katar","Suudi Arabistan","Kuveyt","Bahreyn","Umman","Ürdün","Lübnan",
    "İsrail","Filistin","Irak","İran",
  ],
  "Kafkasya & Orta Asya": [
    "Azerbaycan","Gürcistan","Ermenistan","Kazakistan","Özbekistan","Kırgızistan",
    "Türkmenistan","Tacikistan",
  ],
  "Asya": [
    "Çin","Hong Kong","Japonya","Güney Kore","Singapur","Malezya","Tayland","Vietnam",
    "Endonezya","Filipinler","Hindistan","Pakistan","Bangladeş","Sri Lanka",
  ],
  "Kuzey Amerika": ["ABD","Kanada","Meksika"],
  "Güney Amerika": [
    "Brezilya","Arjantin","Şili","Kolombiya","Peru","Uruguay","Venezuela","Küba","Panama","Kosta Rika",
  ],
  "Okyanusya": ["Avustralya","Yeni Zelanda"],
  "Afrika": [
    "Mısır","Fas","Tunus","Cezayir","Libya","Güney Afrika","Nijerya","Kenya","Etiyopya",
    "Tanzanya","Gana","Senegal","Sudan","Somali","Ruanda","Uganda",
  ],
};

export const continentList = Object.keys(continents);
