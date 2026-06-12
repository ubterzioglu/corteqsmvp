// Dünya Kupası işletme kampanyası — başvuru sayfası (/dunya-kupasi/kayit).
// Akış: oturum yoksa /login?next= CTA'sı (OAuth turunu LoginPage yönetir);
// oturum varsa başvuru durumu veya form. Mutasyon create_world_cup_registration_v1.

import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, ImagePlus, Trophy, X, XCircle } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createWorldCupRegistration,
  fetchMyWorldCupRegistration,
  fetchWorldCupCampaignSettings,
  listBusinessCategoryOptions,
  uploadWorldCupImage,
} from "@/lib/dunya-kupasi-api";
import {
  worldCupRegistrationFormSchema,
  type WorldCupRegistrationFormValues,
} from "@/lib/dunya-kupasi-schemas";

const KAYIT_PATH = "/dunya-kupasi/kayit";
const LOGIN_SIGNUP_URL = `/login?mode=signup&next=${encodeURIComponent(KAYIT_PATH)}`;
const LOGIN_URL = `/login?next=${encodeURIComponent(KAYIT_PATH)}`;

const DEFAULT_FORM_VALUES: Partial<WorldCupRegistrationFormValues> = {
  businessName: "",
  categoryRoleKey: "",
  country: "",
  city: "",
  phone: "",
  address: "",
  note: "",
};

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const DunyaKupasiKayitPage = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ["world-cup", "settings"],
    queryFn: fetchWorldCupCampaignSettings,
  });

  const myRegistrationQuery = useQuery({
    queryKey: ["world-cup", "my-registration", user?.id],
    queryFn: () => fetchMyWorldCupRegistration(user?.id ?? ""),
    enabled: Boolean(user?.id),
  });

  const categoriesQuery = useQuery({
    queryKey: ["world-cup", "business-categories"],
    queryFn: listBusinessCategoryOptions,
    enabled: Boolean(user?.id),
  });

  const form = useForm<WorldCupRegistrationFormValues>({
    resolver: zodResolver(worldCupRegistrationFormSchema),
    defaultValues: DEFAULT_FORM_VALUES as WorldCupRegistrationFormValues,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const clearImage = () => {
    setImageFile(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!IMAGE_ACCEPTED_TYPES.includes(file.type)) {
      clearImage();
      toast({
        title: "Desteklenmeyen görsel formatı",
        description: "JPEG, PNG veya WebP formatında bir görsel yükleyin.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > IMAGE_MAX_BYTES) {
      clearImage();
      toast({
        title: "Görsel çok büyük",
        description: "Görsel en fazla 5MB olabilir.",
        variant: "destructive",
      });
      return;
    }
    setImageFile(file);
  };

  const createMutation = useMutation({
    mutationFn: async (values: WorldCupRegistrationFormValues) => {
      const imagePath = imageFile ? await uploadWorldCupImage(imageFile, user?.id ?? "") : undefined;
      return createWorldCupRegistration({ ...values, imagePath });
    },
    onSuccess: async () => {
      clearImage();
      await queryClient.invalidateQueries({ queryKey: ["world-cup", "my-registration", user?.id] });
      toast({
        title: "Başvurunuz alındı! ✅",
        description: "Yönetici onayından sonra işletme profiliniz aktifleşecek ve Dünya Kupası sayfasında listeleneceksiniz.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Başvuru gönderilemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const registration = myRegistrationQuery.data ?? null;
  const campaignActive = settingsQuery.data?.isActive ?? false;
  const showForm =
    Boolean(user) &&
    campaignActive &&
    !myRegistrationQuery.isLoading &&
    (!registration || registration.status === "rejected");

  const pageBody = useMemo(() => {
    if (isAuthLoading || settingsQuery.isLoading) {
      return <p className="text-center text-muted-foreground">Yükleniyor...</p>;
    }

    if (!campaignActive) {
      return (
        <Alert>
          <AlertTitle>Kampanya aktif değil</AlertTitle>
          <AlertDescription>
            Dünya Kupası işletme kampanyası şu anda başvuruya kapalı.{" "}
            <Link to="/dunya-kupasi" className="underline">
              Kampanya sayfasına dön
            </Link>
          </AlertDescription>
        </Alert>
      );
    }

    if (!user) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Önce hesabınızla giriş yapın</CardTitle>
            <CardDescription>
              Başvurunuz hesabınıza bağlanır; onaylandığında aynı hesap doğrudan işletme profiliniz olur.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link to={LOGIN_SIGNUP_URL}>Google veya e-posta ile kayıt ol</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link to={LOGIN_URL}>Zaten hesabım var, giriş yap</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (myRegistrationQuery.isLoading) {
      return <p className="text-center text-muted-foreground">Başvuru durumunuz kontrol ediliyor...</p>;
    }

    if (registration?.status === "pending") {
      return (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle>Başvurunuz onay bekliyor</AlertTitle>
          <AlertDescription>
            "{registration.businessName}" başvurunuz alındı. Yönetici onayından sonra işletme profiliniz
            aktifleşecek ve Dünya Kupası sayfasında listeleneceksiniz.
          </AlertDescription>
        </Alert>
      );
    }

    if (registration?.status === "approved") {
      return (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Başvurunuz onaylandı 🎉</AlertTitle>
          <AlertDescription>
            "{registration.businessName}" artık bir işletme profili.{" "}
            <Link to="/dunya-kupasi" className="underline">
              Dünya Kupası sayfasında görüntüleyin
            </Link>
            .
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }, [campaignActive, isAuthLoading, myRegistrationQuery.isLoading, registration, settingsQuery.isLoading, user]);

  const onSubmit = form.handleSubmit((values) => createMutation.mutate(values));

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <Trophy className="mx-auto mb-3 h-10 w-10 text-amber-500" />
        <h1 className="text-3xl font-bold">Dünya Kupası İşletme Kaydı</h1>
        <p className="mt-2 text-muted-foreground">
          Maç yayını yapan işletmenizi kaydedin; onay sonrası hesabınız işletme profiline dönüşür ve
          kampanya sayfasında tanıtılırsınız.
        </p>
      </div>

      <div className="space-y-6">
        {pageBody}

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>İşletme Bilgileri</CardTitle>
              {registration?.status === "rejected" && (
                <CardDescription className="flex items-start gap-2 text-destructive">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Önceki başvurunuz reddedildi{registration.reviewNote ? `: ${registration.reviewNote}` : "."}{" "}
                  Bilgilerinizi güncelleyip yeniden başvurabilirsiniz.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">İşletme Adı *</Label>
                  <Input id="businessName" placeholder="Örn: Boğaz Cafe" {...form.register("businessName")} />
                  {form.formState.errors.businessName && (
                    <p className="text-sm text-destructive">{form.formState.errors.businessName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>İşletme Kategorisi *</Label>
                  <Controller
                    control={form.control}
                    name="categoryRoleKey"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {(categoriesQuery.data ?? []).map((option) => (
                            <SelectItem key={option.key} value={option.key}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.categoryRoleKey && (
                    <p className="text-sm text-destructive">{form.formState.errors.categoryRoleKey.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Ülke *</Label>
                    <Input id="country" placeholder="Örn: Almanya" {...form.register("country")} />
                    {form.formState.errors.country && (
                      <p className="text-sm text-destructive">{form.formState.errors.country.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Şehir *</Label>
                    <Input id="city" placeholder="Örn: Berlin" {...form.register("city")} />
                    {form.formState.errors.city && (
                      <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Örn: +49 170 1234567"
                    {...form.register("phone")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Kampanya sayfasındaki kartınızda "Ara" butonu olarak gösterilir.
                  </p>
                  {form.formState.errors.phone && (
                    <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adres *</Label>
                  <Input id="address" placeholder="Müşterilerin sizi bulacağı adres" {...form.register("address")} />
                  <p className="text-xs text-muted-foreground">
                    Kartınızdaki "Haritada Aç" butonu bu adresle Google Maps'e yönlendirir.
                  </p>
                  {form.formState.errors.address && (
                    <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessImage">İşletme Görseli (opsiyonel)</Label>
                  <input
                    ref={imageInputRef}
                    id="businessImage"
                    type="file"
                    accept={IMAGE_ACCEPTED_TYPES.join(",")}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  {imageFile ? (
                    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <span className="flex min-w-0 items-center gap-2 text-sm">
                        <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{imageFile.name}</span>
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={clearImage} aria-label="Görseli kaldır">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => imageInputRef.current?.click()}
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Görsel seç (JPEG/PNG/WebP, en fazla 5MB)
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Görsel, kampanya sayfasındaki kartınızın üst banner'ı olarak gösterilir.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Not (opsiyonel)</Label>
                  <Textarea
                    id="note"
                    placeholder="Yayın düzeniniz hakkında kısa bilgi (ekran sayısı, rezervasyon vb.)"
                    {...form.register("note")}
                  />
                </div>

                <div className="flex items-start gap-3 rounded-md border p-3">
                  <Controller
                    control={form.control}
                    name="broadcastConfirmed"
                    render={({ field }) => (
                      <Checkbox
                        id="broadcastConfirmed"
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    )}
                  />
                  <Label htmlFor="broadcastConfirmed" className="text-sm font-normal leading-snug">
                    İşletmemizde Dünya Kupası maçlarını yayınladığımızı beyan ederim. *
                  </Label>
                </div>
                {form.formState.errors.broadcastConfirmed && (
                  <p className="text-sm text-destructive">{form.formState.errors.broadcastConfirmed.message}</p>
                )}

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Gönderiliyor..." : "Başvuruyu Gönder"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DunyaKupasiKayitPage;
