import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KADRO_ROLES } from "@/lib/kadro/roles";
import { KADRO_DEPTS } from "@/lib/kadro/kadro-taxonomy";
import { buildKadroAdText } from "@/lib/kadro/kadro-ad-text";
import { trIncludes } from "@/lib/text-normalization";
import { Copy, Check } from "lucide-react";

/** Radix Select boş string değerli SelectItem'da hata fırlatır; "tümü" için sentinel. */
const ALL_DEPTS = "all";

function AdminKadroIlanlarPage() {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>(ALL_DEPTS);
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  const rolesWithAd = KADRO_ROLES.filter((r) => r.ad !== null);

  const filteredRoles = rolesWithAd.filter((role) => {
    if (selectedDept !== ALL_DEPTS && role.dept !== selectedDept) return false;
    if (search) {
      const searchText = `${role.title} ${role.ad?.sum ?? ""} ${role.ad?.does.join(" ") ?? ""} ${role.ad?.profile.join(" ") ?? ""}`;
      if (!trIncludes(searchText, search)) return false;
    }
    return true;
  });

  const handleCopy = async (role: typeof KADRO_ROLES[0]) => {
    const adText = buildKadroAdText(role);
    if (adText) {
      await navigator.clipboard.writeText(adText);
      setCopiedRole(role.id);
      setTimeout(() => setCopiedRole(null), 2000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          İlan Metinleri
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          {rolesWithAd.length} pozisyon için hazır ilan metinleri
        </p>
      </div>

      <div className="mb-6 flex gap-4">
        <Input
          placeholder="Ara: pozisyon, özet, görevler..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={selectedDept} onValueChange={setSelectedDept}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tüm Departmanlar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_DEPTS}>Tüm Departmanlar</SelectItem>
            {KADRO_DEPTS.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredRoles.map((role) => {
          const isExpanded = expandedRole === role.id;
          const adText = buildKadroAdText(role);
          const dept = KADRO_DEPTS.find((d) => d.id === role.dept);

          return (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{role.title}</CardTitle>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {dept?.name} · Dalga {role.wave}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(role)}
                    >
                      {copiedRole === role.id ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Kopyalandı
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Kopyala
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                    >
                      {isExpanded ? "Gizle" : "Göster"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {isExpanded && adText && (
                <CardContent>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-sans">
                      {adText}
                    </pre>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">
            Filtrelere uygun ilan metni bulunamadı
          </p>
        </div>
      )}
    </div>
  );
}

export default AdminKadroIlanlarPage;
