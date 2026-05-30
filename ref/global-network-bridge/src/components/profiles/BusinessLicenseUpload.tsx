import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileCheck2, Upload, X, Eye, ShieldCheck, Clock, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type Status = "not_uploaded" | "pending" | "approved" | "rejected";

interface Props {
  /** Account context label, e.g. "İşletme", "Danışman", "Kuruluş" */
  contextLabel?: string;
}

export function BusinessLicenseUpload({ contextLabel = "Hesabınız" }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [doc, setDoc] = useState<{ path: string; name: string } | null>(null);
  const [status, setStatus] = useState<Status>("not_uploaded");
  const [adminNote, setAdminNote] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("business_license_path, business_license_name, business_license_status, business_license_admin_note")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || !data) return;
      if (data.business_license_path) {
        setDoc({ path: data.business_license_path, name: data.business_license_name || "Ruhsat" });
      }
      setStatus((data.business_license_status as Status) || "not_uploaded");
      setAdminNote(data.business_license_admin_note || null);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Dosya çok büyük", description: "Maksimum 20 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/license-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("user-documents")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      if (doc?.path && doc.path !== path) {
        await supabase.storage.from("user-documents").remove([doc.path]);
      }

      const { error: dbErr } = await supabase.from("profiles").update({
        business_license_path: path,
        business_license_name: file.name,
        business_license_uploaded_at: new Date().toISOString(),
        business_license_status: "pending",
        business_license_admin_note: null,
      }).eq("id", user.id);
      if (dbErr) throw dbErr;

      setDoc({ path, name: file.name });
      setStatus("pending");
      setAdminNote(null);
      toast({ title: "Ruhsat yüklendi", description: "Admin onayı bekleniyor." });
    } catch (err: any) {
      toast({ title: "Yükleme hatası", description: err?.message || "Tekrar deneyin", variant: "destructive" });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemove = async () => {
    if (!user?.id || !doc) return;
    try {
      await supabase.storage.from("user-documents").remove([doc.path]);
      await supabase.from("profiles").update({
        business_license_path: null,
        business_license_name: null,
        business_license_uploaded_at: null,
        business_license_status: "not_uploaded",
        business_license_admin_note: null,
      }).eq("id", user.id);
      setDoc(null);
      setStatus("not_uploaded");
      setAdminNote(null);
      toast({ title: "Kaldırıldı" });
    } catch (err: any) {
      toast({ title: "Hata", description: err?.message || "Tekrar deneyin", variant: "destructive" });
    }
  };

  const handleOpen = async () => {
    if (!doc) return;
    const { data, error } = await supabase.storage
      .from("user-documents")
      .createSignedUrl(doc.path, 60 * 5);
    if (error || !data?.signedUrl) {
      toast({ title: "Açılamadı", description: error?.message || "Tekrar deneyin", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const statusBadge = () => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600 hover:bg-green-600 gap-1"><ShieldCheck className="h-3 w-3" /> Onaylandı</Badge>;
      case "pending":
        return <Badge className="bg-amber-500 hover:bg-amber-500 gap-1"><Clock className="h-3 w-3" /> Admin onayı bekleniyor</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Reddedildi</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><Upload className="h-3 w-3" /> Yüklenmedi</Badge>;
    }
  };

  return (
    <Card id="business-license" className="border-amber-200/60 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileCheck2 className="h-5 w-5 text-amber-600" />
          İş Yeri Açma Ruhsatı
          {statusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Bulunduğunuz ülkede geçerli olan iş yeri açma ruhsatınızı buraya yükleyiniz. (PDF, JPG, PNG · Maks 20 MB)
        </p>

        <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-3 flex gap-2 text-sm">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Profil Ayarları'ndaki tüm sorular eksiksiz cevaplandıktan ve ruhsatınız <strong>admin onayı</strong>{" "}
            aldıktan sonra {contextLabel.toLowerCase()} aktif hale gelecektir.
          </span>
        </div>

        {doc ? (
          <div className="flex items-center justify-between gap-2 rounded-md border bg-card p-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <FileCheck2 className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-sm font-medium truncate">{doc.name}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={handleOpen}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()} disabled={uploading}>
                <Upload className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleRemove}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => inputRef.current?.click()} disabled={uploading} className="w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Yükleniyor..." : "Ruhsatı Yükle"}
          </Button>
        )}

        {status === "rejected" && adminNote && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <strong className="text-destructive">Admin notu:</strong> {adminNote}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </CardContent>
    </Card>
  );
}

export default BusinessLicenseUpload;
