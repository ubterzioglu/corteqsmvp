/**
 * Şehir Elçisi başvuru formu.
 *
 * ⚠️ GİRİŞ ZORUNLU: `city_ambassador_applications` tablosunun INSERT politikası
 * yalnız `authenticated` rolüne açıktır. Bu yüzden form, giriş yapmamış
 * ziyaretçiye HİÇ çizilmez — gönderip 42501 yemek yerine giriş bağlantısı
 * gösterilir. (Referans demo sayfası gönderim anında `navigate("/auth")`
 * yapıyordu; kullanıcı formu doldurduktan SONRA atılıyordu, o davranış alınmadı.)
 *
 * `useAuth` KANONİK yoldan gelir: `@/components/auth/useAuth`. CLAUDE.md'nin
 * uyarısı — başka bir yolu mock'lamak testte sessizce hiçbir şey değiştirmez.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, LogIn, Send, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ConsentCheckboxes, {
  emptyConsent,
  isConsentValid,
  type ConsentState,
} from "@/components/ConsentCheckboxes";
import { useAuth } from "@/components/auth/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  cityAmbassadorApplicationSchema,
  submitCityAmbassadorApplication,
  type CityAmbassadorApplicationInput,
} from "@/lib/city-ambassador-applications";

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs font-medium text-destructive">{message}</p> : null;

const AmbassadorApplicationForm = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [consent, setConsent] = useState<ConsentState>(emptyConsent);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CityAmbassadorApplicationInput>({
    resolver: zodResolver(cityAmbassadorApplicationSchema),
    defaultValues: { fullName: "", email: "", phone: "", city: "", country: "" },
  });

  const onSubmit = async (values: CityAmbassadorApplicationInput) => {
    if (!user) return;
    if (!isConsentValid(consent)) {
      toast({
        title: "Onay gerekli",
        description: "Gizlilik, kullanım koşulları ve veri işleme onaylarını işaretleyin.",
        variant: "destructive",
      });
      return;
    }

    const result = await submitCityAmbassadorApplication(user.id, values);

    if (result.ok) {
      setSubmitted(true);
      toast({
        title: "Başvurun alındı 🎉",
        description: "Ekibimiz başvurunu inceleyip en kısa sürede sana dönecek.",
      });
      return;
    }

    toast({
      title: "Başvuru gönderilemedi",
      description: result.message ?? "Başvuru kaydedilemedi.",
      variant: "destructive",
    });
  };

  if (isAuthLoading) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center gap-2 p-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Yükleniyor…
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 text-center md:p-8">
          <h3 className="text-lg font-bold text-foreground">Başvuru için giriş yap</h3>
          <p className="mx-auto mt-2 max-w-md font-body text-sm text-muted-foreground">
            Şehir elçisi başvurusu hesabına bağlanır, böylece sürecini takip edebilir ve
            ekibimizle yazışabilirsin.
          </p>
          <Button asChild className="mt-5 gap-2">
            <Link to="/login?next=%2Fcity-ambassadors">
              <LogIn className="h-4 w-4" aria-hidden="true" /> Giriş Yap veya Kayıt Ol
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="border-turquoise/40 bg-turquoise/5">
        <CardContent className="p-6 text-center md:p-8">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-turquoise" aria-hidden="true" />
          <h3 className="text-lg font-bold text-foreground">Başvurun bize ulaştı</h3>
          <p className="mx-auto mt-2 max-w-md font-body text-sm text-muted-foreground">
            Şehrindeki ağ için attığın bu adım için teşekkürler. Başvuruları sırayla
            değerlendiriyoruz ve her başvuruya dönüş yapıyoruz.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardContent className="p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="amb-fullName">Ad Soyad *</Label>
              <Input id="amb-fullName" {...register("fullName")} autoComplete="name" />
              <FieldError message={errors.fullName?.message} />
            </div>
            <div>
              <Label htmlFor="amb-email">E-posta *</Label>
              <Input id="amb-email" type="email" {...register("email")} autoComplete="email" />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="amb-phone">Telefon (WhatsApp) *</Label>
              <Input
                id="amb-phone"
                {...register("phone")}
                placeholder="+49…"
                autoComplete="tel"
                inputMode="tel"
              />
              <FieldError message={errors.phone?.message} />
            </div>
            <div>
              <Label htmlFor="amb-city">Şehir *</Label>
              <Input id="amb-city" {...register("city")} autoComplete="address-level2" />
              <FieldError message={errors.city?.message} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="amb-country">Ülke *</Label>
              <Input id="amb-country" {...register("country")} autoComplete="country-name" />
              <FieldError message={errors.country?.message} />
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <h3 className="flex items-center gap-2 font-bold text-foreground">
              <Star className="h-4 w-4 text-gold" aria-hidden="true" /> Birkaç soru
            </h3>

            <div>
              <Label htmlFor="amb-reachCount">Doğrudan kaç kişiye ulaşabilirsin?</Label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input
                  id="amb-reachCount"
                  type="number"
                  min={0}
                  {...register("reachCount")}
                  placeholder="Sayı"
                />
                <div className="sm:col-span-2">
                  <Input
                    {...register("reachDescription")}
                    placeholder="Açıklama (ör. arkadaş çevresi, iş ağı…)"
                    aria-label="Ulaşım açıklaması"
                  />
                </div>
              </div>
              <FieldError message={errors.reachCount?.message} />
            </div>

            <div>
              <Label htmlFor="amb-events">Son 3 ayda etkinlik düzenledin mi?</Label>
              <Textarea id="amb-events" rows={2} {...register("organizedEvents")} />
            </div>

            <div>
              <Label htmlFor="amb-pros">Tanıdığın 3-5 uzman veya profesyonel</Label>
              <Textarea
                id="amb-pros"
                rows={2}
                {...register("knownProfessionals")}
                placeholder="İsim ve uzmanlık alanı…"
              />
            </div>

            <div>
              <Label htmlFor="amb-plan">İlk 7 gününde ne yapardın?</Label>
              <Textarea id="amb-plan" rows={3} {...register("firstWeekPlan")} />
            </div>

            <div>
              <Label htmlFor="amb-hours">Haftada kaç saat ayırabilirsin?</Label>
              <Input id="amb-hours" {...register("weeklyHours")} placeholder="Ör. 10-15 saat" />
            </div>

            <div>
              <Label htmlFor="amb-motivation">Bu rol senin için neden önemli?</Label>
              <Textarea id="amb-motivation" rows={3} {...register("motivation")} />
            </div>
          </div>

          <ConsentCheckboxes value={consent} onChange={setConsent} />

          <Button
            type="submit"
            size="lg"
            className="w-full gap-2"
            disabled={isSubmitting || !isConsentValid(consent)}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {isSubmitting ? "Gönderiliyor…" : "Başvurumu Gönder"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AmbassadorApplicationForm;
