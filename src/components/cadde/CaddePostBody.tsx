// Paylaşım gövdesi: düz metin + tıklanabilir #hashtag ve @mention.
//
// Ayrıştırma saf TS'te (cadde-text.ts splitCaddeBody); burada yalnız render var.
// Mention hedefi gövdedeki sıraya göre DEĞİL, paylaşımla birlikte gelen mentions
// listesindeki display_label eşleşmesine göre bulunur — kullanıcı metni sonradan
// düzenlerse sıra kayabilir, etiket eşleşmesi kaymaz.

import { Link } from "react-router-dom";

import { splitCaddeBody } from "@/lib/cadde-text";
import { trFold } from "@/lib/text-normalization";
import type { CaddePostMention } from "@/lib/cadde-types";

const mentionHref = (mention: CaddePostMention): string | null => {
  switch (mention.type) {
    case "cafe":
      return `/cadde/cafe/${mention.id}`;
    case "carsi_item":
      return `/cadde/carsi/${mention.id}`;
    case "catalog_item":
      // Katalog profilleri slug ile açılır; id ile açan rota yok — link verilmez.
      return null;
    case "user":
      return null;
    default:
      return null;
  }
};

// m60 — "kafe paylaşımlarına bağlantı ekleyebilmesi".
//
// Bağlantılar hiçbir Cadde yüzeyinde tıklanabilir DEĞİLDİ (kafe akışı da, ana akış da
// düz metin basıyordu). Linkleştirme bilinçli olarak BURADA, yalnız düz metin
// parçalarında yapılır — splitCaddeBody'ye dokunulmaz, çünkü onun hashtag ayrıştırması
// SQL tarafıyla ayna sözleşmesidir.
//
// Güvenlik: yalnız http/https kabul edilir (javascript: gibi şemalar eşleşmez),
// dış bağlantılar target=_blank + rel="noreferrer noopener" ile açılır.
const URL_PATTERN = /(https?:\/\/[^\s<]+)/g;

/** Adresin sonuna yapışan noktalama link'e dahil edilmez ("...cadde." → "...cadde"). */
const trimTrailingPunctuation = (url: string): string => url.replace(/[.,:;!?'")\]}]+$/, "");

type TextPiece = { kind: "text" | "url"; value: string };

// Dışa AÇILMADI: react-refresh kuralı bileşen dosyasından sabit/fonksiyon ihracını
// uyarıyor. Davranış bileşen üzerinden test edilir (CaddePostBody.test.tsx).
const splitTextAndUrls = (text: string): TextPiece[] => {
  const pieces: TextPiece[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const raw = match[0];
    const url = trimTrailingPunctuation(raw);
    const start = match.index ?? 0;

    if (start > lastIndex) pieces.push({ kind: "text", value: text.slice(lastIndex, start) });
    pieces.push({ kind: "url", value: url });
    // Kırpılan noktalama metin olarak geri döner.
    if (raw.length > url.length) pieces.push({ kind: "text", value: raw.slice(url.length) });
    lastIndex = start + raw.length;
  }

  if (lastIndex < text.length) pieces.push({ kind: "text", value: text.slice(lastIndex) });
  return pieces;
};

export interface CaddePostBodyProps {
  body: string;
  mentions?: readonly CaddePostMention[];
}

const CaddePostBody = ({ body, mentions = [] }: CaddePostBodyProps) => {
  const segments = splitCaddeBody(body);
  if (segments.length === 0) return null;

  // "@Ayşe Kaya" metnindeki token, etiketin ilk kelimesiyle başlar; Türkçe-toleranslı eşleştir.
  const findMention = (token: string): CaddePostMention | undefined =>
    mentions.find((mention) => {
      const label = mention.label ?? "";
      if (!label) return false;
      return trFold(label).startsWith(trFold(token)) || trFold(token).startsWith(trFold(label));
    });

  return (
    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700" data-testid="cadde-post-body">
      {segments.map((segment, index) => {
        if (segment.kind === "hashtag") {
          return (
            <Link
              key={`h-${index}`}
              to={`/cadde?etiket=${encodeURIComponent(segment.tag)}`}
              className="font-medium text-sky-700 hover:underline"
            >
              {segment.value}
            </Link>
          );
        }

        if (segment.kind === "mention") {
          const mention = findMention(segment.token);
          const href = mention ? mentionHref(mention) : null;
          if (href) {
            return (
              <Link key={`m-${index}`} to={href} className="font-medium text-slate-900 hover:underline">
                {segment.value}
              </Link>
            );
          }
          // Hedefi çözülemeyen mention link olmaz ama vurgulanır (metin bütünlüğü korunur).
          return (
            <span key={`m-${index}`} className="font-medium text-slate-900">
              {segment.value}
            </span>
          );
        }

        // m60: düz metin parçasındaki adresler tıklanabilir hale gelir.
        return (
          <span key={`t-${index}`}>
            {splitTextAndUrls(segment.value).map((piece, pieceIndex) =>
              piece.kind === "url" ? (
                <a
                  key={`u-${index}-${pieceIndex}`}
                  href={piece.value}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-sky-700 underline-offset-2 hover:underline"
                >
                  {piece.value}
                </a>
              ) : (
                <span key={`p-${index}-${pieceIndex}`}>{piece.value}</span>
              ),
            )}
          </span>
        );
      })}
    </p>
  );
};

export default CaddePostBody;
