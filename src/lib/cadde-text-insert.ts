export interface TextSelection {
  start: number;
  end: number;
}

const clampIndex = (index: number, length: number) => Math.min(Math.max(index, 0), length);

// m62 — "emoji ekleme ve gösterme sırasında oluşan hatalar".
//
// JS string'i UTF-16 kod BİRİMİ dizisidir; emoji'nin çoğu iki birimlik bir surrogate
// çiftidir (😊 = "😊"). İmleç/seçim indeksi çiftin ortasına düşerse ham
// slice yarım surrogate üretir ve karakter "" olarak bozulur — metin bir daha
// düzelmez, kayıt da bozuk gider. Bu yüzden indeksler kod noktası sınırına çekilir.
const isLowSurrogate = (code: number) => code >= 0xdc00 && code <= 0xdfff;

/** Yarım surrogate kalmasın diye başlangıcı bir geri alır. */
const snapStart = (value: string, index: number) =>
  index > 0 && isLowSurrogate(value.charCodeAt(index)) ? index - 1 : index;

/** Yarım surrogate kalmasın diye bitişi bir ileri alır. */
const snapEnd = (value: string, index: number) =>
  index < value.length && isLowSurrogate(value.charCodeAt(index)) ? index + 1 : index;

export function insertTextAtSelection(value: string, insert: string, selection: TextSelection): { value: string; caret: number } {
  const rawStart = clampIndex(Math.min(selection.start, selection.end), value.length);
  const rawEnd = clampIndex(Math.max(selection.start, selection.end), value.length);

  // Boş imleç ile gerçek seçim FARKLI davranmalı:
  // - imleç emoji'nin ortasındaysa emoji SİLİNMEZ, imleç emoji'nin soluna kayar;
  // - gerçek seçimin kenarı emoji'yi yarıyorsa seçim o emoji'yi tümüyle kapsar.
  const collapsed = rawStart === rawEnd;
  const start = snapStart(value, rawStart);
  const end = collapsed ? start : snapEnd(value, rawEnd);
  const nextValue = `${value.slice(0, start)}${insert}${value.slice(end)}`;
  return {
    value: nextValue,
    caret: start + insert.length,
  };
}
