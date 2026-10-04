// G05 · Telefon doğrulama kartı — profil sayfasında telefon doğrulama akışı.
//
// 🔴 AMAÇ: Mevcut hesaba telefon eklemek + doğrulamak. Phone sign-up/sign-in KAPALI.
// 🔴 Akış: Telefon gir → Kod gönder → Kodu doğrula → user_verifications'a aynalanır.
// 🔴 HIZ SINIRI: Auth'un yerleşik sınırları geçerli. DB'de gözlem yapılır, enforcement YOK.
//    Kullanıcı başına 5/gün, 3/saat politikası ENFORCED değil — KARAR GEREKİR.

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Phone, Shield, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  fetchPhoneVerificationStatus,
  sendPhoneVerificationCode,
  verifyPhoneVerificationCode,
  PHONE_VERIFICATION_ERROR_MESSAGES,
} from "@/lib/phone-verification-api";

export interface PhoneVerificationCardProps {
  className?: string;
}

export function PhoneVerificationCard({ className }: PhoneVerificationCardProps) {
  const queryClient = useQueryClient();
  const [phoneInput, setPhoneInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["phone-verification-status"],
    queryFn: fetchPhoneVerificationStatus,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (status?.isVerified) {
      setCodeSent(false);
      setPhoneInput("");
      setCodeInput("");
    }
  }, [status?.isVerified]);

  const handleSendCode = async () => {
    setError(null);
    setSuccess(null);
    setIsSending(true);

    try {
      await sendPhoneVerificationCode(phoneInput);
      setCodeSent(true);
      setSuccess("Doğrulama kodu gönderildi. Telefonunu kontrol et.");
      await queryClient.invalidateQueries({ queryKey: ["phone-verification-status"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : PHONE_VERIFICATION_ERROR_MESSAGES.send_failed);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    setSuccess(null);
    setIsVerifying(true);

    try {
      await verifyPhoneVerificationCode(codeInput);
      setSuccess("Telefon başarıyla doğrulandı!");
      setCodeSent(false);
      setCodeInput("");
      await queryClient.invalidateQueries({ queryKey: ["phone-verification-status"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : PHONE_VERIFICATION_ERROR_MESSAGES.verify_failed);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setCodeSent(false);
    setPhoneInput("");
    setCodeInput("");
    setError(null);
    setSuccess(null);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm">Telefon Doğrulama</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Telefon Doğrulama</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Telefonunu doğrula, hesabının güvenliğini artır.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status?.isVerified ? (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-950/20">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Telefon doğrulandı
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                {status.phone}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              Doğrulandı
            </Badge>
          </div>
        ) : codeSent ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>{phoneInput}</strong> numarasına doğrulama kodu gönderildi.
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                Kodu aşağıya gir.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium" htmlFor="verification-code">
                Doğrulama Kodu
              </label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleVerifyCode}
                disabled={isVerifying || codeInput.length < 4}
                className="flex-1"
              >
                {isVerifying ? "Doğrulanıyor..." : "Doğrula"}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={isVerifying}>
                İptal
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
              <Phone className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <p className="text-xs text-amber-900 dark:text-amber-100">
                  Telefonun henüz doğrulanmamış.
                </p>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Doğrulamak için telefon numaranı gir, sana SMS ile kod göndereceğiz.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium" htmlFor="phone-input">
                Telefon Numarası
              </label>
              <Input
                id="phone-input"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+90 5XX XXX XX XX"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ülke koduyla başla (örn. +90)
              </p>
            </div>
            <Button
              onClick={handleSendCode}
              disabled={isSending || !phoneInput.trim()}
              className="w-full"
            >
              {isSending ? "Gönderiliyor..." : "Doğrulama Kodu Gönder"}
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-950/20">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-xs text-red-900 dark:text-red-100">{error}</p>
          </div>
        )}

        {success && !error && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-xs text-green-900 dark:text-green-100">{success}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PhoneVerificationCard;
