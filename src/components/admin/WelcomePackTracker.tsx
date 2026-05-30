import { useState, useEffect } from "react";
import { Gift, MapPin, Calendar, Users, Plane, Car, Bus, Baby, PawPrint, Eye, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface WelcomePackOrder {
  id: string;
  country: string;
  city: string;
  arrival_date: string;
  adults: number;
  children: number;
  has_pet: boolean;
  pet_details: string | null;
  needs_baby_seat: boolean;
  needs_airport_transfer: boolean;
  needs_car_rental: boolean;
  needs_flight_discount: boolean;
  needs_mentor: boolean;
  mentor_type: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  user_id: string;
}

const WelcomePackTracker = () => {
  const [orders, setOrders] = useState<WelcomePackOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("welcome_pack_orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  const statusColors: Record<string, string> = {
    open: "bg-primary/10 text-primary",
    in_progress: "bg-amber-500/10 text-amber-600",
    completed: "bg-emerald-500/10 text-emerald-600",
  };

  const statusLabels: Record<string, string> = {
    open: "Açık",
    in_progress: "Teklifler Var",
    completed: "Tamamlandı",
  };

  const stats = {
    total: orders.length,
    open: orders.filter(o => o.status === "open").length,
    transfer: orders.filter(o => o.needs_airport_transfer).length,
    carRental: orders.filter(o => o.needs_car_rental).length,
    flight: orders.filter(o => o.needs_flight_discount).length,
    mentor: orders.filter(o => o.needs_mentor).length,
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Toplam Paket", value: stats.total, icon: Gift },
          { label: "Açık Talepler", value: stats.open, icon: Eye },
          { label: "Transfer", value: stats.transfer, icon: Bus },
          { label: "Araç Kiralama", value: stats.carRental, icon: Car },
          { label: "Uçak Bileti", value: stats.flight, icon: Plane },
          { label: "Mentör", value: stats.mentor, icon: UserCheck },
        ].map(s => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-3 text-center">
              <s.icon className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Henüz hoşgeldin paketi talebi yok.</p>
        ) : (
          orders.map(order => (
            <Card key={order.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-semibold text-sm">{order.city}, {order.country}</span>
                      <Badge className={`text-[10px] ${statusColors[order.status] || ""}`}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(order.arrival_date).toLocaleDateString("tr-TR")}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {order.adults}Y + {order.children}Ç</span>
                      {order.needs_flight_discount && <Badge variant="outline" className="text-[10px] gap-1"><Plane className="h-2.5 w-2.5" /> Uçak</Badge>}
                      {order.needs_car_rental && <Badge variant="outline" className="text-[10px] gap-1"><Car className="h-2.5 w-2.5" /> Araç</Badge>}
                      {order.needs_airport_transfer && <Badge variant="outline" className="text-[10px] gap-1"><Bus className="h-2.5 w-2.5" /> Transfer</Badge>}
                      {order.needs_baby_seat && <Badge variant="outline" className="text-[10px] gap-1"><Baby className="h-2.5 w-2.5" /> Bebek</Badge>}
                      {order.has_pet && <Badge variant="outline" className="text-[10px] gap-1"><PawPrint className="h-2.5 w-2.5" /> Hayvan</Badge>}
                      {order.needs_mentor && <Badge variant="outline" className="text-[10px] gap-1"><UserCheck className="h-2.5 w-2.5" /> Mentör {order.mentor_type === "paid" ? "(Ücretli)" : "(Gönüllü)"}</Badge>}
                    </div>
                    {order.notes && <p className="text-xs text-muted-foreground mt-1 truncate">📝 {order.notes}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(order.created_at).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WelcomePackTracker;
