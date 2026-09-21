import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useKadroBoard } from "@/hooks/kadro/useKadroBoard";
import { KADRO_AXES } from "@/lib/kadro/kadro-taxonomy";
import type { KadroResolvedRole } from "@/lib/kadro/kadro-types";
import { KADRO_STATUSES, KADRO_PRIORITIES } from "@/lib/kadro/kadro-taxonomy";

function AdminKadroMatrisPage() {
  const { roles } = useKadroBoard();

  const pazarlamaRoles = roles.filter((r) => r.dept === "pazarlama");

  const urunRoles = pazarlamaRoles.filter((r) => r.axis === "urun");
  const islevRoles = pazarlamaRoles.filter((r) => r.axis === "islev");
  const cografyaRoles = pazarlamaRoles.filter((r) => r.axis === "cografya");

  const urunAxis = KADRO_AXES.find((a) => a.id === "urun");
  const islevAxis = KADRO_AXES.find((a) => a.id === "islev");
  const cografyaAxis = KADRO_AXES.find((a) => a.id === "cografya");

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Pazarlama Matrisi
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Pazarlama departmanının üç ekseni: Ürün, İşlev ve Coğrafya
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{urunAxis?.name ?? "Ürün Hattı"}</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {urunAxis?.desc}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {urunRoles.map((role) => (
                <RoleCard key={role.id} role={role} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{islevAxis?.name ?? "İşlev Hattı"}</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {islevAxis?.desc}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {islevRoles.map((role) => (
                <RoleCard key={role.id} role={role} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{cografyaAxis?.name ?? "Coğrafya Hattı"}</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {cografyaAxis?.desc}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cografyaRoles.map((role) => (
                <RoleCard key={role.id} role={role} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminKadroMatrisPage;

function RoleCard({ role }: { role: KadroResolvedRole }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "dolu":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200";
      case "acik":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
      case "gorusme":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
      case "teklif":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "kritik":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
      case "yuksek":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200";
      case "orta":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200";
      case "dusuk":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <div className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-1">
        {role.title}
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
        Dalga {role.wave}
      </div>
      <div className="flex gap-2">
        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(role.currentStatus)}`}>
          {role.currentStatus}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(role.currentPriority)}`}>
          {role.currentPriority}
        </span>
      </div>
    </div>
  );
}
