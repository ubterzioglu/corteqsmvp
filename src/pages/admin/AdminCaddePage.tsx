import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Edit, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  deleteAdminCaddeBillboardCard,
  deleteAdminCaddeCafe,
  deleteAdminCaddePost,
  deleteAdminCaddeSponsoredPlacement,
  listAdminCaddeBillboardCards,
  listAdminCaddeCafes,
  listAdminCaddePosts,
  listAdminCaddeSponsoredPlacements,
  listCaddeCities,
  listCaddeCountries,
  saveAdminCaddeBillboardCard,
  saveAdminCaddeCafe,
  saveAdminCaddePost,
  saveAdminCaddeSponsoredPlacement,
  type CaddeAdminBillboardInput,
  type CaddeAdminCafeInput,
  type CaddeAdminPostInput,
  type CaddeAdminSponsoredInput,
  type CaddeBillboardType,
  type CaddeContentMode,
  type CaddePostType,
} from "@/lib/cadde";

type DraftStatus = "draft" | "published" | "hidden";

type PostFormState = Omit<CaddeAdminPostInput, "country_id" | "city_id"> & { countryName: string; cityName: string };
type CafeFormState = Omit<CaddeAdminCafeInput, "country_id" | "city_id"> & { countryName: string; cityName: string };
type BillboardFormState = Omit<CaddeAdminBillboardInput, "country_id" | "city_id"> & { countryName: string; cityName: string };
type SponsoredFormState = Omit<CaddeAdminSponsoredInput, "country_id" | "city_id"> & { countryName: string; cityName: string };

const postDefaults = (): PostFormState => ({
  content_mode: "demo",
  status: "published",
  post_type: "text",
  title: null,
  body: "",
  countryName: "",
  cityName: "",
  is_bridge: false,
  pinned: false,
  author_name_override: null,
  author_role: null,
});

const cafeDefaults = (): CafeFormState => ({
  content_mode: "demo",
  status: "published",
  title: "",
  summary: "",
  countryName: "",
  cityName: "",
  is_bridge: false,
  is_free: true,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
  is_active: true,
  host_name_override: null,
});

const billboardDefaults = (): BillboardFormState => ({
  card_type: "consultant",
  title: "",
  subtitle: null,
  description: "",
  badge_text: null,
  cta_label: "",
  cta_url: "",
  image_url: null,
  content_mode: "demo",
  status: "published",
  countryName: "",
  cityName: "",
  is_featured: false,
  sort_order: 0,
});

const sponsoredDefaults = (): SponsoredFormState => ({
  placement_key: "feed-inline",
  title: "",
  description: "",
  badge_text: null,
  cta_label: "",
  cta_url: "",
  image_url: null,
  content_mode: "demo",
  status: "published",
  countryName: "",
  cityName: "",
  sort_order: 0,
});

const normalizeText = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export default function AdminCaddePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingCafeId, setEditingCafeId] = useState<string | null>(null);
  const [editingBillboardId, setEditingBillboardId] = useState<string | null>(null);
  const [editingSponsoredId, setEditingSponsoredId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState<PostFormState>(postDefaults);
  const [cafeForm, setCafeForm] = useState<CafeFormState>(cafeDefaults);
  const [billboardForm, setBillboardForm] = useState<BillboardFormState>(billboardDefaults);
  const [sponsoredForm, setSponsoredForm] = useState<SponsoredFormState>(sponsoredDefaults);

  const countriesQuery = useQuery({ queryKey: ["cadde", "countries"], queryFn: listCaddeCountries });
  const allCitiesQuery = useQuery({ queryKey: ["cadde", "all-cities"], queryFn: () => listCaddeCities("") });

  const postsQuery = useQuery({ queryKey: ["admin", "cadde", "posts"], queryFn: listAdminCaddePosts });
  const cafesQuery = useQuery({ queryKey: ["admin", "cadde", "cafes"], queryFn: listAdminCaddeCafes });
  const billboardsQuery = useQuery({ queryKey: ["admin", "cadde", "billboards"], queryFn: listAdminCaddeBillboardCards });
  const sponsoredQuery = useQuery({ queryKey: ["admin", "cadde", "sponsored"], queryFn: listAdminCaddeSponsoredPlacements });

  const refreshAdminCadde = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "cadde", "posts"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "cadde", "cafes"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "cadde", "billboards"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "cadde", "sponsored"] }),
    ]);
  };

  const postMutation = useMutation({
    mutationFn: async () => {
      const payload: CaddeAdminPostInput = {
        content_mode: postForm.content_mode,
        status: postForm.status,
        post_type: postForm.post_type,
        title: normalizeText(postForm.title ?? ""),
        body: postForm.body.trim(),
        country_id: normalizeText(postForm.countryName),
        city_id: normalizeText(postForm.cityName),
        is_bridge: postForm.is_bridge,
        pinned: postForm.pinned,
        author_name_override: normalizeText(postForm.author_name_override ?? ""),
        author_role: normalizeText(postForm.author_role ?? ""),
      };
      return saveAdminCaddePost(editingPostId, payload);
    },
    onSuccess: async () => {
      toast({ title: "Cadde post kaydedildi" });
      setEditingPostId(null);
      setPostForm(postDefaults());
      await refreshAdminCadde();
    },
    onError: (error) => toast({ title: "Cadde post kaydedilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" }),
  });

  const cafeMutation = useMutation({
    mutationFn: async () => {
      const payload: CaddeAdminCafeInput = {
        content_mode: cafeForm.content_mode,
        status: cafeForm.status,
        title: cafeForm.title.trim(),
        summary: cafeForm.summary.trim(),
        country_id: normalizeText(cafeForm.countryName),
        city_id: normalizeText(cafeForm.cityName),
        is_bridge: cafeForm.is_bridge,
        is_free: cafeForm.is_free,
        starts_at: new Date(cafeForm.starts_at).toISOString(),
        ends_at: new Date(cafeForm.ends_at).toISOString(),
        is_active: cafeForm.is_active,
        host_name_override: normalizeText(cafeForm.host_name_override ?? ""),
      };
      return saveAdminCaddeCafe(editingCafeId, payload);
    },
    onSuccess: async () => {
      toast({ title: "Cadde cafe kaydedildi" });
      setEditingCafeId(null);
      setCafeForm(cafeDefaults());
      await refreshAdminCadde();
    },
    onError: (error) => toast({ title: "Cadde cafe kaydedilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" }),
  });

  const billboardMutation = useMutation({
    mutationFn: async () => {
      const payload: CaddeAdminBillboardInput = {
        card_type: billboardForm.card_type,
        title: billboardForm.title.trim(),
        subtitle: normalizeText(billboardForm.subtitle ?? ""),
        description: billboardForm.description.trim(),
        badge_text: normalizeText(billboardForm.badge_text ?? ""),
        cta_label: billboardForm.cta_label.trim(),
        cta_url: billboardForm.cta_url.trim(),
        image_url: normalizeText(billboardForm.image_url ?? ""),
        content_mode: billboardForm.content_mode,
        status: billboardForm.status,
        country_id: normalizeText(billboardForm.countryName),
        city_id: normalizeText(billboardForm.cityName),
        is_featured: billboardForm.is_featured,
        sort_order: Number(billboardForm.sort_order) || 0,
      };
      return saveAdminCaddeBillboardCard(editingBillboardId, payload);
    },
    onSuccess: async () => {
      toast({ title: "Billboard kaydedildi" });
      setEditingBillboardId(null);
      setBillboardForm(billboardDefaults());
      await refreshAdminCadde();
    },
    onError: (error) => toast({ title: "Billboard kaydedilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" }),
  });

  const sponsoredMutation = useMutation({
    mutationFn: async () => {
      const payload: CaddeAdminSponsoredInput = {
        placement_key: sponsoredForm.placement_key.trim(),
        title: sponsoredForm.title.trim(),
        description: sponsoredForm.description.trim(),
        badge_text: normalizeText(sponsoredForm.badge_text ?? ""),
        cta_label: sponsoredForm.cta_label.trim(),
        cta_url: sponsoredForm.cta_url.trim(),
        image_url: normalizeText(sponsoredForm.image_url ?? ""),
        content_mode: sponsoredForm.content_mode,
        status: sponsoredForm.status,
        country_id: normalizeText(sponsoredForm.countryName),
        city_id: normalizeText(sponsoredForm.cityName),
        sort_order: Number(sponsoredForm.sort_order) || 0,
      };
      return saveAdminCaddeSponsoredPlacement(editingSponsoredId, payload);
    },
    onSuccess: async () => {
      toast({ title: "Sponsorlu alan kaydedildi" });
      setEditingSponsoredId(null);
      setSponsoredForm(sponsoredDefaults());
      await refreshAdminCadde();
    },
    onError: (error) => toast({ title: "Sponsorlu alan kaydedilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" }),
  });

  const countryOptions = useMemo(() => countriesQuery.data ?? [], [countriesQuery.data]);
  const allCities = useMemo(() => allCitiesQuery.data ?? [], [allCitiesQuery.data]);
  const countryNameById = useMemo(() => new Map(countryOptions.map((country) => [country.id, country.name])), [countryOptions]);
  const cityNameById = useMemo(() => new Map(allCities.map((city) => [city.id, city.name])), [allCities]);
  const postCityOptions = useMemo(() => filterCitiesByCountryName(allCities, countryOptions, postForm.countryName), [allCities, countryOptions, postForm.countryName]);
  const cafeCityOptions = useMemo(() => filterCitiesByCountryName(allCities, countryOptions, cafeForm.countryName), [allCities, countryOptions, cafeForm.countryName]);
  const billboardCityOptions = useMemo(() => filterCitiesByCountryName(allCities, countryOptions, billboardForm.countryName), [allCities, countryOptions, billboardForm.countryName]);
  const sponsoredCityOptions = useMemo(() => filterCitiesByCountryName(allCities, countryOptions, sponsoredForm.countryName), [allCities, countryOptions, sponsoredForm.countryName]);

  const selectStatus = (value: string) => value as DraftStatus;
  const selectMode = (value: string) => value as CaddeContentMode;
  const selectPostType = (value: string) => value as CaddePostType;
  const selectBillboardType = (value: string) => value as CaddeBillboardType;

  const postRows = postsQuery.data ?? [];
  const cafeRows = cafesQuery.data ?? [];
  const billboardRows = billboardsQuery.data ?? [];
  const sponsoredRows = sponsoredQuery.data ?? [];

  const stats = useMemo(
    () => [
      { label: "Post", value: postRows.length },
      { label: "Cafe", value: cafeRows.length },
      { label: "Billboard", value: billboardRows.length },
      { label: "Sponsor", value: sponsoredRows.length },
    ],
    [billboardRows.length, cafeRows.length, postRows.length, sponsoredRows.length],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cadde Yönetimi</CardTitle>
          <CardDescription>Demo ve gerçek Cadde içeriğini tek panelden yönet.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {stats.map((item) => (
            <div key={item.label} className="rounded-2xl border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-bold">{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="space-y-5">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="posts">Postlar</TabsTrigger>
          <TabsTrigger value="cafes">Cafeler</TabsTrigger>
          <TabsTrigger value="billboards">Billboard</TabsTrigger>
          <TabsTrigger value="sponsored">Sponsorlu</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle>{editingPostId ? "Cadde Post Düzenle" : "Yeni Cadde Post"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Select value={postForm.content_mode} onValueChange={(value) => setPostForm((current) => ({ ...current, content_mode: selectMode(value) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="real">Gerçek</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={postForm.status} onValueChange={(value) => setPostForm((current) => ({ ...current, status: selectStatus(value) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={postForm.post_type} onValueChange={(value) => setPostForm((current) => ({ ...current, post_type: selectPostType(value) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Başlık" value={postForm.title ?? ""} onChange={(event) => setPostForm((current) => ({ ...current, title: event.target.value }))} />
              <Textarea placeholder="Post gövdesi" rows={5} value={postForm.body} onChange={(event) => setPostForm((current) => ({ ...current, body: event.target.value }))} />
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Yazar görünen adı" value={postForm.author_name_override ?? ""} onChange={(event) => setPostForm((current) => ({ ...current, author_name_override: event.target.value }))} />
                <Input placeholder="Yazar rolü" value={postForm.author_role ?? ""} onChange={(event) => setPostForm((current) => ({ ...current, author_role: event.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Select value={postForm.countryName || "__all__"} onValueChange={(value) => setPostForm((current) => ({ ...current, countryName: value === "__all__" ? "" : value, cityName: "" }))}>
                  <SelectTrigger><SelectValue placeholder="Ülke" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Ülke seçme</SelectItem>
                    {countryOptions.map((country) => <SelectItem key={country.id} value={country.name}>{country.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={postForm.cityName || "__all__"} onValueChange={(value) => setPostForm((current) => ({ ...current, cityName: value === "__all__" ? "" : value }))}>
                  <SelectTrigger><SelectValue placeholder="Şehir" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Şehir seçme</SelectItem>
                    {postCityOptions.map((city) => <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2"><Switch checked={postForm.is_bridge} onCheckedChange={(checked) => setPostForm((current) => ({ ...current, is_bridge: checked }))} /><Label>Köprü</Label></div>
                <div className="flex items-center gap-2"><Switch checked={postForm.pinned} onCheckedChange={(checked) => setPostForm((current) => ({ ...current, pinned: checked }))} /><Label>Pinned</Label></div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => postMutation.mutate()} disabled={postMutation.isPending}>{editingPostId ? "Güncelle" : "Kaydet"}</Button>
                <Button variant="outline" onClick={() => { setEditingPostId(null); setPostForm(postDefaults()); }}>Temizle</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-5">
            <CardHeader><CardTitle>Mevcut Postlar</CardTitle></CardHeader>
            <CardContent>
              <AdminSimpleTable
                headers={["Başlık", "Mod", "Durum", "Tip", "Aksiyon"]}
                rows={postRows.map((row) => ({
                  key: row.id,
                  cells: [row.title ?? "(Başlıksız)", row.content_mode, row.status, row.post_type],
                  actions: (
                    <>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingPostId(row.id);
                        setPostForm({
                          content_mode: row.content_mode,
                          status: row.status,
                          post_type: row.post_type,
                          title: row.title,
                          body: row.body,
                          countryName: row.country_id ? countryNameById.get(row.country_id) ?? "" : "",
                          cityName: row.city_id ? cityNameById.get(row.city_id) ?? "" : "",
                          is_bridge: row.is_bridge,
                          pinned: row.pinned,
                          author_name_override: row.author_name_override,
                          author_role: row.author_role,
                        });
                      }}><Edit className="h-4 w-4" /></Button>
                      <DeleteButton onDelete={() => deleteAdminCaddePost(row.id).then(refreshAdminCadde)} />
                    </>
                  ),
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cafes">
          <EntityEditorCard
            title={editingCafeId ? "Cafe Düzenle" : "Yeni Cafe"}
            saveLabel={editingCafeId ? "Güncelle" : "Kaydet"}
            onSave={() => cafeMutation.mutate()}
            onReset={() => { setEditingCafeId(null); setCafeForm(cafeDefaults()); }}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ModeStatusSelectors
                mode={cafeForm.content_mode}
                status={cafeForm.status}
                onModeChange={(value) => setCafeForm((current) => ({ ...current, content_mode: selectMode(value) }))}
                onStatusChange={(value) => setCafeForm((current) => ({ ...current, status: selectStatus(value) }))}
              />
            </div>
            <Input placeholder="Cafe başlığı" value={cafeForm.title} onChange={(event) => setCafeForm((current) => ({ ...current, title: event.target.value }))} />
            <Textarea placeholder="Cafe açıklaması" rows={4} value={cafeForm.summary} onChange={(event) => setCafeForm((current) => ({ ...current, summary: event.target.value }))} />
            <LocationSelectors
              countries={countryOptions}
              cities={cafeCityOptions}
              countryName={cafeForm.countryName}
              cityName={cafeForm.cityName}
              onCountryChange={(value) => setCafeForm((current) => ({ ...current, countryName: value, cityName: "" }))}
              onCityChange={(value) => setCafeForm((current) => ({ ...current, cityName: value }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input type="datetime-local" value={cafeForm.starts_at} onChange={(event) => setCafeForm((current) => ({ ...current, starts_at: event.target.value }))} />
              <Input type="datetime-local" value={cafeForm.ends_at} onChange={(event) => setCafeForm((current) => ({ ...current, ends_at: event.target.value }))} />
            </div>
            <Input placeholder="Host görünen adı" value={cafeForm.host_name_override ?? ""} onChange={(event) => setCafeForm((current) => ({ ...current, host_name_override: event.target.value }))} />
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2"><Switch checked={cafeForm.is_bridge} onCheckedChange={(checked) => setCafeForm((current) => ({ ...current, is_bridge: checked }))} /><Label>Köprü</Label></div>
              <div className="flex items-center gap-2"><Switch checked={cafeForm.is_free} onCheckedChange={(checked) => setCafeForm((current) => ({ ...current, is_free: checked }))} /><Label>Ücretsiz</Label></div>
              <div className="flex items-center gap-2"><Switch checked={cafeForm.is_active} onCheckedChange={(checked) => setCafeForm((current) => ({ ...current, is_active: checked }))} /><Label>Aktif</Label></div>
            </div>
          </EntityEditorCard>
          <AdminSimpleTable
            headers={["Başlık", "Mod", "Durum", "Aktif", "Aksiyon"]}
            rows={cafeRows.map((row) => ({
              key: row.id,
              cells: [row.title, row.content_mode, row.status, row.is_active ? "Evet" : "Hayır"],
              actions: (
                <>
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingCafeId(row.id);
                    setCafeForm({
                      content_mode: row.content_mode,
                      status: row.status,
                      title: row.title,
                      summary: row.summary,
                      countryName: row.country_id ? countryNameById.get(row.country_id) ?? "" : "",
                      cityName: row.city_id ? cityNameById.get(row.city_id) ?? "" : "",
                      is_bridge: row.is_bridge,
                      is_free: row.is_free,
                      starts_at: row.starts_at.slice(0, 16),
                      ends_at: row.ends_at.slice(0, 16),
                      is_active: row.is_active,
                      host_name_override: row.host_name_override,
                    });
                  }}><Edit className="h-4 w-4" /></Button>
                  <DeleteButton onDelete={() => deleteAdminCaddeCafe(row.id).then(refreshAdminCadde)} />
                </>
              ),
            }))}
          />
        </TabsContent>

        <TabsContent value="billboards">
          <EntityEditorCard
            title={editingBillboardId ? "Billboard Düzenle" : "Yeni Billboard"}
            saveLabel={editingBillboardId ? "Güncelle" : "Kaydet"}
            onSave={() => billboardMutation.mutate()}
            onReset={() => { setEditingBillboardId(null); setBillboardForm(billboardDefaults()); }}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ModeStatusSelectors
                mode={billboardForm.content_mode}
                status={billboardForm.status}
                onModeChange={(value) => setBillboardForm((current) => ({ ...current, content_mode: selectMode(value) }))}
                onStatusChange={(value) => setBillboardForm((current) => ({ ...current, status: selectStatus(value) }))}
              />
              <Select value={billboardForm.card_type} onValueChange={(value) => setBillboardForm((current) => ({ ...current, card_type: selectBillboardType(value) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultant">Consultant</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Başlık" value={billboardForm.title} onChange={(event) => setBillboardForm((current) => ({ ...current, title: event.target.value }))} />
            <Input placeholder="Alt başlık" value={billboardForm.subtitle ?? ""} onChange={(event) => setBillboardForm((current) => ({ ...current, subtitle: event.target.value }))} />
            <Textarea placeholder="Açıklama" rows={4} value={billboardForm.description} onChange={(event) => setBillboardForm((current) => ({ ...current, description: event.target.value }))} />
            <LocationSelectors
              countries={countryOptions}
              cities={billboardCityOptions}
              countryName={billboardForm.countryName}
              cityName={billboardForm.cityName}
              onCountryChange={(value) => setBillboardForm((current) => ({ ...current, countryName: value, cityName: "" }))}
              onCityChange={(value) => setBillboardForm((current) => ({ ...current, cityName: value }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="CTA etiketi" value={billboardForm.cta_label} onChange={(event) => setBillboardForm((current) => ({ ...current, cta_label: event.target.value }))} />
              <Input placeholder="CTA URL" value={billboardForm.cta_url} onChange={(event) => setBillboardForm((current) => ({ ...current, cta_url: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Input placeholder="Badge" value={billboardForm.badge_text ?? ""} onChange={(event) => setBillboardForm((current) => ({ ...current, badge_text: event.target.value }))} />
              <Input placeholder="Image URL" value={billboardForm.image_url ?? ""} onChange={(event) => setBillboardForm((current) => ({ ...current, image_url: event.target.value }))} />
              <Input placeholder="Sort order" inputMode="numeric" value={String(billboardForm.sort_order)} onChange={(event) => setBillboardForm((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-2"><Switch checked={billboardForm.is_featured} onCheckedChange={(checked) => setBillboardForm((current) => ({ ...current, is_featured: checked }))} /><Label>Featured</Label></div>
          </EntityEditorCard>
          <AdminSimpleTable
            headers={["Başlık", "Tip", "Mod", "Durum", "Aksiyon"]}
            rows={billboardRows.map((row) => ({
              key: row.id,
              cells: [row.title, row.card_type, row.content_mode, row.status],
              actions: (
                <>
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingBillboardId(row.id);
                    setBillboardForm({
                      card_type: row.card_type,
                      title: row.title,
                      subtitle: row.subtitle,
                      description: row.description,
                      badge_text: row.badge_text,
                      cta_label: row.cta_label,
                      cta_url: row.cta_url,
                      image_url: row.image_url,
                      content_mode: row.content_mode,
                      status: row.status,
                      countryName: row.country_id ? countryNameById.get(row.country_id) ?? "" : "",
                      cityName: row.city_id ? cityNameById.get(row.city_id) ?? "" : "",
                      is_featured: row.is_featured,
                      sort_order: row.sort_order,
                    });
                  }}><Edit className="h-4 w-4" /></Button>
                  <DeleteButton onDelete={() => deleteAdminCaddeBillboardCard(row.id).then(refreshAdminCadde)} />
                </>
              ),
            }))}
          />
        </TabsContent>

        <TabsContent value="sponsored">
          <EntityEditorCard
            title={editingSponsoredId ? "Sponsorlu Yerleşim Düzenle" : "Yeni Sponsorlu Yerleşim"}
            saveLabel={editingSponsoredId ? "Güncelle" : "Kaydet"}
            onSave={() => sponsoredMutation.mutate()}
            onReset={() => { setEditingSponsoredId(null); setSponsoredForm(sponsoredDefaults()); }}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ModeStatusSelectors
                mode={sponsoredForm.content_mode}
                status={sponsoredForm.status}
                onModeChange={(value) => setSponsoredForm((current) => ({ ...current, content_mode: selectMode(value) }))}
                onStatusChange={(value) => setSponsoredForm((current) => ({ ...current, status: selectStatus(value) }))}
              />
            </div>
            <Input placeholder="Placement key" value={sponsoredForm.placement_key} onChange={(event) => setSponsoredForm((current) => ({ ...current, placement_key: event.target.value }))} />
            <Input placeholder="Başlık" value={sponsoredForm.title} onChange={(event) => setSponsoredForm((current) => ({ ...current, title: event.target.value }))} />
            <Textarea placeholder="Açıklama" rows={4} value={sponsoredForm.description} onChange={(event) => setSponsoredForm((current) => ({ ...current, description: event.target.value }))} />
            <LocationSelectors
              countries={countryOptions}
              cities={sponsoredCityOptions}
              countryName={sponsoredForm.countryName}
              cityName={sponsoredForm.cityName}
              onCountryChange={(value) => setSponsoredForm((current) => ({ ...current, countryName: value, cityName: "" }))}
              onCityChange={(value) => setSponsoredForm((current) => ({ ...current, cityName: value }))}
            />
            <div className="grid gap-4 md:grid-cols-3">
              <Input placeholder="Badge" value={sponsoredForm.badge_text ?? ""} onChange={(event) => setSponsoredForm((current) => ({ ...current, badge_text: event.target.value }))} />
              <Input placeholder="CTA etiketi" value={sponsoredForm.cta_label} onChange={(event) => setSponsoredForm((current) => ({ ...current, cta_label: event.target.value }))} />
              <Input placeholder="CTA URL" value={sponsoredForm.cta_url} onChange={(event) => setSponsoredForm((current) => ({ ...current, cta_url: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Image URL" value={sponsoredForm.image_url ?? ""} onChange={(event) => setSponsoredForm((current) => ({ ...current, image_url: event.target.value }))} />
              <Input placeholder="Sort order" inputMode="numeric" value={String(sponsoredForm.sort_order)} onChange={(event) => setSponsoredForm((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))} />
            </div>
          </EntityEditorCard>
          <AdminSimpleTable
            headers={["Başlık", "Placement", "Mod", "Durum", "Aksiyon"]}
            rows={sponsoredRows.map((row) => ({
              key: row.id,
              cells: [row.title, row.placement_key, row.content_mode, row.status],
              actions: (
                <>
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingSponsoredId(row.id);
                    setSponsoredForm({
                      placement_key: row.placement_key,
                      title: row.title,
                      description: row.description,
                      badge_text: row.badge_text,
                      cta_label: row.cta_label,
                      cta_url: row.cta_url,
                      image_url: row.image_url,
                      content_mode: row.content_mode,
                      status: row.status,
                      countryName: row.country_id ? countryNameById.get(row.country_id) ?? "" : "",
                      cityName: row.city_id ? cityNameById.get(row.city_id) ?? "" : "",
                      sort_order: row.sort_order,
                    });
                  }}><Edit className="h-4 w-4" /></Button>
                  <DeleteButton onDelete={() => deleteAdminCaddeSponsoredPlacement(row.id).then(refreshAdminCadde)} />
                </>
              ),
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModeStatusSelectors({
  mode,
  status,
  onModeChange,
  onStatusChange,
}: {
  mode: CaddeContentMode;
  status: DraftStatus;
  onModeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}) {
  return (
    <>
      <Select value={mode} onValueChange={onModeChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="demo">Demo</SelectItem>
          <SelectItem value="real">Gerçek</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="published">Published</SelectItem>
          <SelectItem value="hidden">Hidden</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}

function EntityEditorCard({
  title,
  saveLabel,
  onSave,
  onReset,
  children,
}: {
  title: string;
  saveLabel: string;
  onSave: () => void;
  onReset: () => void;
  children: ReactNode;
}) {
  return (
    <Card className="mb-5">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {children}
        <div className="flex gap-3">
          <Button onClick={onSave}><Plus className="mr-2 h-4 w-4" />{saveLabel}</Button>
          <Button variant="outline" onClick={onReset}>Temizle</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LocationSelectors({
  countries,
  cities,
  countryName,
  cityName,
  onCountryChange,
  onCityChange,
}: {
  countries: Array<{ id: string; name: string }>;
  cities: Array<{ id: string; name: string }>;
  countryName: string;
  cityName: string;
  onCountryChange: (value: string) => void;
  onCityChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Select value={countryName || "__all__"} onValueChange={(value) => onCountryChange(value === "__all__" ? "" : value)}>
        <SelectTrigger><SelectValue placeholder="Ülke" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Ülke seçme</SelectItem>
          {countries.map((country) => <SelectItem key={country.id} value={country.name}>{country.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={cityName || "__all__"} onValueChange={(value) => onCityChange(value === "__all__" ? "" : value)}>
        <SelectTrigger><SelectValue placeholder="Şehir" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Şehir seçme</SelectItem>
          {cities.map((city) => <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function AdminSimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<{ key: string; cells: string[]; actions: React.ReactNode }>;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => <TableHead key={header}>{header}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                {row.cells.map((cell, index) => <TableCell key={`${row.key}-${index}`}>{cell}</TableCell>)}
                <TableCell className="flex gap-2">{row.actions}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => {
        if (!window.confirm("Bu kayıt silinsin mi?")) return;
        void onDelete();
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function filterCitiesByCountryName(
  cities: Array<{ id: string; name: string; countryId: string }>,
  countries: Array<{ id: string; name: string }>,
  countryName: string,
) {
  if (!countryName) return cities;
  const country = countries.find((item) => item.name === countryName);
  if (!country) return [];
  return cities.filter((city) => city.countryId === country.id);
}
