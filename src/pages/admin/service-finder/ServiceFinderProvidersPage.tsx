// /admin/service-finder/providers — sağlayıcı ayarları ve bütçe tavanları.
// Sırlar burada YOK: secret_ref yalnızca worker ortamındaki env değişken adıdır.
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useServiceFinderProviders,
  useUpsertServiceFinderProvider,
} from "@/hooks/useServiceFinder";
import type { ServiceFinderProviderConfigRow } from "@/lib/service-finder-schemas";

function ProviderCard({ provider }: { provider: ServiceFinderProviderConfigRow }) {
  const upsert = useUpsertServiceFinderProvider();
  const [enabled, setEnabled] = useState(provider.is_enabled);
  const [model, setModel] = useState(provider.default_model ?? "");
  const [monthlyCap, setMonthlyCap] = useState(provider.monthly_cap_usd?.toString() ?? "");
  const [requestDefaults, setRequestDefaults] = useState(
    JSON.stringify(provider.request_defaults ?? {}, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const save = () => {
    let parsedDefaults: Record<string, unknown>;
    try {
      parsedDefaults = JSON.parse(requestDefaults || "{}");
      setJsonError(null);
    } catch {
      setJsonError("request_defaults geçerli JSON olmalı");
      return;
    }
    upsert.mutate({
      providerId: provider.id,
      patch: {
        is_enabled: enabled,
        default_model: model || null,
        monthly_cap_usd: monthlyCap ? Number(monthlyCap) : null,
        request_defaults: parsedDefaults,
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">{provider.display_name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {provider.provider_key} · {provider.provider_kind} · Anahtar env:{" "}
            <code>{provider.secret_ref}</code> (maskelenmiş, tarayıcıya gelmez)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`sf-prov-${provider.id}`} className="text-sm">
            Etkin
          </Label>
          <Switch id={`sf-prov-${provider.id}`} checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Varsayılan model</Label>
            <Input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder={provider.provider_kind === "classify" ? "gemini-2.5-flash-lite" : "—"}
              disabled={provider.provider_kind !== "classify"}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Aylık tavan (USD)</Label>
            <Input
              type="number"
              step="1"
              min="0"
              value={monthlyCap}
              onChange={(event) => setMonthlyCap(event.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>İstek varsayılanları (JSON)</Label>
          <textarea
            className="min-h-24 rounded-md border bg-background p-2 font-mono text-xs"
            value={requestDefaults}
            onChange={(event) => setRequestDefaults(event.target.value)}
          />
          {jsonError && <p className="text-xs text-red-600">{jsonError}</p>}
        </div>
        <Button size="sm" onClick={save} disabled={upsert.isPending}>
          {upsert.isPending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ServiceFinderProvidersPage() {
  const { data: providers, isLoading } = useServiceFinderProviders();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Sağlayıcılar</h1>
        <p className="text-sm text-muted-foreground">
          Arama / ekstraksiyon / sınıflandırma sağlayıcı ayarları. API anahtarları Coolify
          ortam değişkenlerinde tutulur; burada yalnızca referans adı görünür.
        </p>
      </div>
      {isLoading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {(providers ?? []).map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>
    </div>
  );
}
