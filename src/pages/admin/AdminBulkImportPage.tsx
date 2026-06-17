import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Upload, FileText, Eye, ArrowRight } from "lucide-react";

import { AdminPageShell } from "@/components/admin/page";
import RoleSearchSelect from "@/components/admin/RoleSearchSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { listAdminCatalogRoles, type AdminCatalogRoleOption } from "@/lib/admin-catalog";
import {
  bulkImportCatalogItems,
  parseImportText,
  type ImportFormat,
} from "@/lib/catalog-import-api";
import type { BulkImportResult, ImportRecord } from "@/lib/catalog-import-schemas";

const DEFAULT_ROLE = "User_DiasporaMember";

const SAMPLE_JSON = `[
  {
    "name": "Dr. Tevfik Kahraman",
    "company": "Medical Practitioner",
    "city": "Melbourne",
    "country": "AU",
    "profession": "Doctor (Turkish)",
    "phone": "",
    "email": "",
    "web": "",
    "address": "Melbourne, Victoria, Australia"
  }
]`;

const AdminBulkImportPage = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rawText, setRawText] = useState("");
  const [format, setFormat] = useState<ImportFormat>("json");
  const [sourceType, setSourceType] = useState("");
  const [defaultRole, setDefaultRole] = useState(DEFAULT_ROLE);
  const [roles, setRoles] = useState<AdminCatalogRoleOption[]>([]);
  const [preview, setPreview] = useState<ImportRecord[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    listAdminCatalogRoles()
      .then((next) => {
        if (isMounted) setRoles(next);
      })
      .catch((error) => {
        toast({
          title: "Roller yüklenemedi",
          description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
          variant: "destructive",
        });
      });
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role.key, label: role.label, hint: role.key, searchText: `${role.label} ${role.key}` })),
    [roles],
  );

  const handlePreview = () => {
    setResult(null);
    try {
      const records = parseImportText(rawText, format);
      setPreview(records);
      setParseError(null);
    } catch (error) {
      setPreview(null);
      setParseError(error instanceof Error ? error.message : "Ayrıştırma hatası.");
    }
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setRawText(text);
    setFormat(file.name.toLowerCase().endsWith(".csv") ? "csv" : "json");
    setPreview(null);
    setResult(null);
    setParseError(null);
  };

  const handleImport = async () => {
    if (!sourceType.trim()) {
      toast({ title: "Kaynak adı gerekli", description: "Bu içe aktarmaya bir kaynak adı verin (ör. melbourne-deep-research-20260617).", variant: "destructive" });
      return;
    }

    let records: ImportRecord[];
    try {
      records = parseImportText(rawText, format);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Ayrıştırma hatası.");
      return;
    }

    setIsImporting(true);
    try {
      const importResult = await bulkImportCatalogItems(records, sourceType.trim(), defaultRole);
      setResult(importResult);
      toast({
        title: "İçe aktarma tamamlandı",
        description: `${importResult.created} kayıt beklemeye alındı, ${importResult.skipped} kayıt atlandı (mevcut/eksik).`,
      });
    } catch (error) {
      toast({
        title: "İçe aktarma başarısız",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AdminPageShell
      title="Toplu İçe Aktarma"
      description="Profesyonel listelerini (CSV/JSON) beklemeye al; ardından Kayıt Veritabanı'ndan tek tek onayla."
      icon={Upload}
      accent="sky"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Veriyi Yapıştır veya Yükle</CardTitle>
            <CardDescription>
              Beklenen alanlar: <code>name</code> (zorunlu), company, city, country, profession, phone, email, web, address.
              JSON bir nesne dizisi; CSV başlık satırı Türkçe/İngilizce sütun adlarını kabul eder.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="import-format">Format</Label>
                <Select value={format} onValueChange={(value) => setFormat(value as ImportFormat)}>
                  <SelectTrigger id="import-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="import-file">Dosya yükle (opsiyonel)</Label>
                <Input
                  id="import-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleFile(file);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-text">Veri</Label>
              <Textarea
                id="import-text"
                value={rawText}
                onChange={(event) => {
                  setRawText(event.target.value);
                  setPreview(null);
                  setResult(null);
                }}
                placeholder={SAMPLE_JSON}
                className="min-h-[220px] font-mono text-xs"
              />
            </div>

            <Button variant="outline" onClick={handlePreview} disabled={!rawText.trim()}>
              <Eye className="mr-2 h-4 w-4" />
              Önizle
            </Button>

            {parseError ? (
              <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {parseError}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {preview ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Önizleme — {preview.length} kayıt</CardTitle>
              <CardDescription>İçe aktarmadan önce kayıtları kontrol edin. Tümü "beklemede" olarak girer.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>İsim</TableHead>
                      <TableHead>Şirket</TableHead>
                      <TableHead>Meslek</TableHead>
                      <TableHead>Şehir</TableHead>
                      <TableHead>İletişim</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 100).map((record, index) => (
                      <TableRow key={`${record.name}-${index}`}>
                        <TableCell className="font-medium">{record.name}</TableCell>
                        <TableCell className="text-muted-foreground">{record.company || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{record.profession || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{record.city || "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {[record.phone, record.email, record.web].filter(Boolean).join(" · ") || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {preview.length > 100 ? (
                <p className="mt-2 text-xs text-muted-foreground">İlk 100 kayıt gösteriliyor; tümü içe aktarılacak.</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Kaynak Bilgisi ve İçe Aktarma</CardTitle>
            <CardDescription>
              Kaynak adı dedup ve izlenebilirlik için kullanılır; aynı kaynak+kayıt tekrar yüklenirse atlanır.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="source-type">Kaynak adı</Label>
                <Input
                  id="source-type"
                  value={sourceType}
                  onChange={(event) => setSourceType(event.target.value)}
                  placeholder="melbourne-deep-research-20260617"
                />
              </div>
              <div className="space-y-2">
                <Label>Varsayılan rol (meslek eşleşmezse)</Label>
                <RoleSearchSelect
                  roles={roleOptions}
                  value={defaultRole}
                  onValueChange={setDefaultRole}
                  placeholder="Rol seçin..."
                />
              </div>
            </div>

            <Button onClick={handleImport} disabled={isImporting || !rawText.trim()}>
              <FileText className="mr-2 h-4 w-4" />
              {isImporting ? "İçe aktarılıyor..." : "Beklemeye Al"}
            </Button>
          </CardContent>
        </Card>

        {result ? (
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardHeader>
              <CardTitle className="text-base">İçe Aktarma Sonucu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Eklenen: {result.created}</Badge>
                <Badge variant="outline">Atlanan: {result.skipped}</Badge>
                <Badge variant="outline">Parti: {result.batch_id}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Bu kayıtlar "İncelemede" (pending_review) olarak girdi ve henüz herkese açık değil.
                Onaylamak veya reddetmek için Kayıt Veritabanı'na gidin ve durum filtresinden "İncelemede"yi seçin.
              </p>
              <Button asChild variant="outline">
                <Link to="/admin/data">
                  Kayıt Veritabanı'na Git
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </AdminPageShell>
  );
};

export default AdminBulkImportPage;
