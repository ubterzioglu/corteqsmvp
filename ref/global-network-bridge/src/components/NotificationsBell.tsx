import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bell, Calendar, UserPlus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { events as mockEvents } from "@/data/mock";

// Demo follow activities — gerçek veride user_follows + feed_posts ile beslenecek.
const followActivities = [
  { id: "a1", name: "Ayşe Kara", action: "yeni bir etkinlik paylaştı", time: "2s", href: "/events" },
  { id: "a2", name: "Mehmet Yılmaz", action: "Cadde'de bir gönderi paylaştı", time: "4s", href: "/cadde" },
  { id: "a3", name: "Zeynep Arslan", action: "bir iş ilanı yayınladı", time: "1g", href: "/is-ilanlari" },
];

const parseEventDate = (d: string) => {
  // "15 Mar 2026" -> Date
  const months: Record<string, number> = {
    Oca: 0, Şub: 1, Mar: 2, Nis: 3, May: 4, Haz: 5,
    Tem: 6, Ağu: 7, Eyl: 8, Eki: 9, Kas: 10, Ara: 11,
  };
  const [day, mon, year] = d.split(" ");
  return new Date(Number(year), months[mon] ?? 0, Number(day));
};

const NotificationsBell = () => {
  const { user, profile } = useAuth();
  if (!user) return null;

  const userCity = (profile as any)?.city as string | undefined;

  const nearestCityEvents = useMemo(() => {
    const now = new Date();
    return mockEvents
      .filter((e) => (userCity ? e.city?.toLowerCase() === userCity.toLowerCase() : true))
      .map((e) => ({ ...e, _d: parseEventDate(e.date) }))
      .filter((e) => e._d.getTime() >= now.getTime() - 24 * 3600 * 1000)
      .sort((a, b) => a._d.getTime() - b._d.getTime())
      .slice(0, 3);
  }, [userCity]);

  const totalCount = followActivities.length + nearestCityEvents.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Bildirimler">
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center">
              {totalCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Bildirimler</span>
          <span className="text-[10px] font-normal text-muted-foreground">Takip + Yakın Etkinlik</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <UserPlus className="h-3 w-3" /> Takip ettiklerin
        </div>
        {followActivities.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">Henüz aktivite yok.</div>
        ) : (
          followActivities.map((a) => (
            <Link
              key={a.id}
              to={a.href}
              className="block px-3 py-2 text-sm hover:bg-accent rounded-md"
            >
              <span className="font-medium">{a.name}</span>{" "}
              <span className="text-muted-foreground">{a.action}</span>
              <span className="ml-1 text-[10px] text-muted-foreground">· {a.time}</span>
            </Link>
          ))
        )}

        <DropdownMenuSeparator />

        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {userCity ? `${userCity} • En yakın etkinlikler` : "En yakın etkinlikler"}
        </div>
        {nearestCityEvents.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            {userCity ? `${userCity} için yaklaşan etkinlik bulunamadı.` : "Profilinde şehir bilgisi yok."}
          </div>
        ) : (
          nearestCityEvents.map((e) => (
            <Link
              key={e.id}
              to={`/events/${e.id}`}
              className="block px-3 py-2 text-sm hover:bg-accent rounded-md"
            >
              <div className="font-medium line-clamp-1">{e.title}</div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {e.date} · {e.time}
                <MapPin className="h-3 w-3 ml-1" />
                {e.city}
              </div>
            </Link>
          ))
        )}

        <DropdownMenuSeparator />
        <Link
          to="/events"
          className="block px-3 py-2 text-xs text-center text-primary hover:underline"
        >
          Tüm etkinlikleri gör →
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationsBell;
