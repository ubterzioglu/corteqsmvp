import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KADRO_ROUTINES, groupRoutinesByFreq } from "@/lib/kadro/kadro-routines";
import { KADRO_ROLES } from "@/lib/kadro/roles";

function AdminKadroRutinlerPage() {
  const groupedRoutines = groupRoutinesByFreq(KADRO_ROUTINES);

  const getOwnerName = (ownerId: string) => {
    const role = KADRO_ROLES.find((r) => r.id === ownerId);
    return role?.title ?? ownerId;
  };

  const getFreqColor = (freq: string) => {
    switch (freq) {
      case "Günlük":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
      case "Haftalık":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
      case "Aylık":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200";
      case "Yıllık":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Rutinler
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Pazarlama ekibinin günlük, haftalık, aylık ve yıllık rutinleri
        </p>
      </div>

      <div className="space-y-6">
        {groupedRoutines.map((group) => (
          <Card key={group.freq}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{group.freq}</CardTitle>
                <span className={`text-xs px-2 py-1 rounded ${getFreqColor(group.freq)}`}>
                  {group.items.length} rutin
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.items.map((routine, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                  >
                    <div className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-1">
                      {routine.name}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {routine.detail}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">
                      Sorumlu: <span className="font-medium">{getOwnerName(routine.owner)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AdminKadroRutinlerPage;
