import { Link } from "react-router-dom";
import { Heart, Star, Users, Briefcase, PenLine, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFollow } from "@/hooks/useFollow";
import { consultants, associations, businesses, bloggers, events } from "@/data/mock";

type Item = {
  id: string;
  kind: string;
  name: string;
  meta?: string;
  to: string;
  Icon: typeof Star;
  badgeLabel: string;
  badgeClass: string;
};

const MyFollowsSection = () => {
  const { list, toggle } = useFollow();

  const items: Item[] = [];
  list("consultant").forEach((id) => {
    const c = consultants.find((x) => x.id === id);
    if (c) items.push({
      id, kind: "consultant", name: c.name, meta: `${c.role} · ${c.city}`,
      to: `/danismanlar/${c.id}`, Icon: Star,
      badgeLabel: "Danışman", badgeClass: "bg-gold/10 text-gold border-gold/30",
    });
  });
  list("association").forEach((id) => {
    const a = associations.find((x) => x.id === id);
    if (a) items.push({
      id, kind: "association", name: a.name, meta: `${a.type} · ${a.city}`,
      to: `/dernekler/${a.id}`, Icon: Users,
      badgeLabel: "Kuruluş", badgeClass: "bg-turquoise/10 text-turquoise border-turquoise/30",
    });
  });
  list("business").forEach((id) => {
    const b = businesses.find((x) => x.id === id);
    if (b) items.push({
      id, kind: "business", name: b.name, meta: `${b.sector} · ${b.city}`,
      to: `/isletmeler/${b.id}`, Icon: Briefcase,
      badgeLabel: "İşletme", badgeClass: "bg-primary/10 text-primary border-primary/30",
    });
  });
  list("blogger").forEach((id) => {
    const bl = bloggers.find((x) => x.id === id);
    if (bl) items.push({
      id, kind: "blogger", name: bl.name, meta: `${bl.type} · ${bl.city}`,
      to: `/blogger/${bl.id}`, Icon: PenLine,
      badgeLabel: "Blogger", badgeClass: "bg-pink-500/10 text-pink-600 border-pink-500/30",
    });
  });
  list("event").forEach((id) => {
    const ev = events.find((x) => x.id === id);
    if (ev) items.push({
      id, kind: "event", name: ev.title, meta: `${ev.date} · ${ev.city}`,
      to: `/etkinlikler/${ev.id}`, Icon: Calendar,
      badgeLabel: "Etkinlik", badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    });
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
        <Heart className="h-5 w-5 text-primary" /> Takip Ettiklerim
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Takip ettiğiniz danışman, kuruluş, işletme, blogger ve etkinlikler burada listelenir.
      </p>

      {items.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <Heart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Henüz kimseyi takip etmiyorsunuz. Profillerdeki <strong>Takip Et</strong> tuşunu kullanın.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((it) => {
            const Icon = it.Icon;
            return (
              <li key={`${it.kind}:${it.id}`} className="flex items-center gap-3 py-3">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={it.to} className="font-medium text-sm text-foreground hover:text-primary truncate block">
                    {it.name}
                  </Link>
                  {it.meta && <p className="text-xs text-muted-foreground truncate">{it.meta}</p>}
                </div>
                <Badge variant="outline" className={`text-[10px] ${it.badgeClass}`}>{it.badgeLabel}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => toggle(it.kind, it.id, it.name)}
                  aria-label="Takipten çık"
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MyFollowsSection;
