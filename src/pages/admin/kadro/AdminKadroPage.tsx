import { useKadroBoard } from "@/hooks/kadro/useKadroBoard";
import { KadroSummary } from "@/components/admin/kadro/KadroSummary";
import { KadroFilters } from "@/components/admin/kadro/KadroFilters";
import { KadroRoleTable } from "@/components/admin/kadro/KadroRoleTable";
import { KadroRoleDrawer } from "@/components/admin/kadro/KadroRoleDrawer";
import { downloadKadroCsv } from "@/lib/kadro/kadro-csv";
import type { KadroResolvedRole } from "@/lib/kadro/kadro-types";
import { useState } from "react";

const AdminKadroPage = () => {
  const { filteredRoles, groups, summary, orphanKeys, filters, setFilters, isLoading, error } = useKadroBoard();
  const [selectedRole, setSelectedRole] = useState<KadroResolvedRole | null>(null);

  const handleExport = () => {
    downloadKadroCsv(filteredRoles);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Hata: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Kadro</h1>
        <p className="text-slate-600 dark:text-slate-400">52 pozisyon · 8 departman · 3 dalga</p>
      </div>

      <KadroSummary summary={summary} orphanCount={orphanKeys.length} />

      <KadroFilters filters={filters} onChange={setFilters} onExport={handleExport} />

      <KadroRoleTable groups={groups} onSelectRole={setSelectedRole} />

      <KadroRoleDrawer role={selectedRole} onClose={() => setSelectedRole(null)} />
    </div>
  );
};

export default AdminKadroPage;
