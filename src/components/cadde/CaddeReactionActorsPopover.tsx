/**
 * CaddeReactionActorsPopover — "Kimler beğendi?" popover bileşeni.
 *
 * Hover-card KULLANMAZ (plan'daki kural: "hover-card kullanmayan mevcut el yapımı panel").
 * Reaksiyon butonuna tıklandığında açılır, kullanıcı listesini gösterir.
 *
 * Özellikler:
 * - Avatar + isim + rol etiketi
 * - Max 50 kullanıcı (RPC limiti)
 * - Yükleme durumu
 * - Boş liste durumu
 */

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { listCaddePostReactors } from "@/lib/cadde-api";
import type { CaddePostReactor, CaddeReactionType } from "@/lib/cadde-types";

interface CaddeReactionActorsPopoverProps {
  postId: string;
  reactionType: CaddeReactionType;
  reactionLabel: string;
  open: boolean;
  onClose: () => void;
}

export default function CaddeReactionActorsPopover({
  postId,
  reactionType,
  reactionLabel,
  open,
  onClose,
}: CaddeReactionActorsPopoverProps) {
  const [reactors, setReactors] = useState<CaddePostReactor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    listCaddePostReactors(postId, reactionType, 50)
      .then(setReactors)
      .catch(() => setReactors([]))
      .finally(() => setLoading(false));
  }, [open, postId, reactionType]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div
        className="relative max-h-[70vh] w-full max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">{reactionLabel}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* İçerik */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
            </div>
          ) : reactors.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">Henüz kimse bu reaksiyonu vermedi.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {reactors.map((reactor) => (
                <li key={reactor.user_id} className="flex items-center gap-3 px-4 py-2.5">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-100 to-slate-200">
                    {reactor.avatar_url ? (
                      <img
                        src={reactor.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-600">
                        {reactor.display_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* İsim + rol */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{reactor.display_name}</p>
                    {reactor.role_label ? (
                      <p className="truncate text-xs text-slate-500">{reactor.role_label}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
