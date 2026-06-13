// İş oluşturma formu — şablon seçimi + lokasyon + bütçe (react-hook-form + zod).
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateServiceFinderJob, useServiceFinderTemplates } from "@/hooks/useServiceFinder";
import { jobCreateSchema, type JobCreateInput } from "@/lib/service-finder-schemas";

interface ServiceFinderJobCreateFormProps {
  onCreated?: (jobId: string) => void;
  compact?: boolean;
}

function splitTerms(value: string): string[] {
  return value
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);
}

export function ServiceFinderJobCreateForm({ onCreated, compact = false }: ServiceFinderJobCreateFormProps) {
  const { data: templates } = useServiceFinderTemplates();
  const createJob = useCreateServiceFinderJob();

  const form = useForm<JobCreateInput>({
    resolver: zodResolver(jobCreateSchema),
    defaultValues: {
      title: "",
      template_id: "",
      role_key: "",
      item_type: "",
      category_slug: "",
      location_label: "",
      country_code: "",
      region: "",
      city: "",
      language_code: "tr",
      freeform_topic: "",
      must_include_terms: [],
      must_exclude_terms: [],
      max_queries: 12,
      max_source_urls: 40,
      max_extract_urls: 25,
      max_candidates: 100,
      soft_cap_usd: 1.5,
      hard_cap_usd: 3,
    },
  });

  const onTemplateChange = (templateId: string) => {
    form.setValue("template_id", templateId);
    const template = templates?.find((entry) => entry.id === templateId);
    if (template) {
      form.setValue("role_key", template.role_key);
      form.setValue("item_type", template.item_type);
      form.setValue("category_slug", template.category_slug ?? "");
      form.setValue("max_queries", template.default_max_queries);
      form.setValue("max_source_urls", template.default_max_source_urls);
      form.setValue("max_extract_urls", template.default_max_extract_urls);
      if (!form.getValues("title")) {
        form.setValue("title", template.label);
      }
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    createJob.mutate(values, {
      onSuccess: (result) => {
        form.reset();
        onCreated?.(result.job_id);
      },
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className={compact ? "grid gap-3 md:grid-cols-2" : "grid gap-4 md:grid-cols-2"}>
          <FormField
            control={form.control}
            name="template_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meslek şablonu</FormLabel>
                <Select value={field.value ?? ""} onValueChange={onTemplateChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Şablon seç (örn. Doktor)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(templates ?? [])
                      .filter((template) => template.is_active)
                      .map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.label} ({template.role_key})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>İş başlığı</FormLabel>
                <FormControl>
                  <Input placeholder="Dortmund Türkçe konuşan doktorlar" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location_label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lokasyon</FormLabel>
                <FormControl>
                  <Input placeholder="Dortmund, Nordrhein-Westfalen, Germany" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Şehir</FormLabel>
                <FormControl>
                  <Input placeholder="Dortmund" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ülke kodu</FormLabel>
                <FormControl>
                  <Input placeholder="DE" maxLength={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="language_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dil</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="de">Almanca</SelectItem>
                    <SelectItem value="en">İngilizce</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="soft_cap_usd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Soft cap (USD)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" min="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hard_cap_usd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hard cap (USD)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" min="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!compact && (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="must_include_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dahil edilecek terimler (virgülle)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Türk, Türkçe, Turkish speaking"
                      value={field.value.join(", ")}
                      onChange={(event) => field.onChange(splitTerms(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="must_exclude_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hariç tutulacak terimler (virgülle)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="forum, reddit, job"
                      value={field.value.join(", ")}
                      onChange={(event) => field.onChange(splitTerms(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="freeform_topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serbest konu (opsiyonel)</FormLabel>
                  <FormControl>
                    <Input placeholder="örn. Türkçe konuşan kardiyolog" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_queries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maks. sorgu</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Şablonsuz manuel kullanım için rol/tip alanları */}
        {!form.watch("template_id") && (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="role_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol anahtarı</FormLabel>
                  <FormControl>
                    <Input placeholder="Healthcare_Doctor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="item_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kayıt tipi</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="advisor / business / organization" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="advisor">advisor</SelectItem>
                      <SelectItem value="business">business</SelectItem>
                      <SelectItem value="organization">organization</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Button type="submit" disabled={createJob.isPending}>
          {createJob.isPending ? "Kuyruğa alınıyor..." : "İşi Kuyruğa Al"}
        </Button>
      </form>
    </Form>
  );
}
