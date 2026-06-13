// src/hooks/useServiceFinder.ts
// React Query hook'ları — Service Finder modülü (useMuhasebe deseni).
// Çalışan işlerde canlı maliyet/ilerleme için kısa aralıklı polling kullanılır.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  cancelJob,
  createJob,
  fetchCostSummary,
  fetchProviders,
  fetchTemplates,
  getJobDetail,
  listJobs,
  publishCandidate,
  retryJob,
  reviewCandidate,
  upsertProvider,
  upsertTemplate,
} from "@/lib/service-finder-api";
import { sfErrorMessage } from "@/lib/service-finder-format";
import type {
  CandidatePatch,
  JobCreateInput,
  ServiceFinderJobDetail,
  ServiceFinderProviderConfigRow,
  ServiceFinderTemplateRow,
} from "@/lib/service-finder-schemas";

const ACTIVE_POLL_MS = 4000;

export const serviceFinderKeys = {
  all: ["service-finder"] as const,
  jobs: (status?: string | null, page?: number) =>
    [...serviceFinderKeys.all, "jobs", status ?? "all", page ?? 0] as const,
  jobDetail: (jobId: string) => [...serviceFinderKeys.all, "job", jobId] as const,
  providers: () => [...serviceFinderKeys.all, "providers"] as const,
  templates: () => [...serviceFinderKeys.all, "templates"] as const,
  costs: (since?: string) => [...serviceFinderKeys.all, "costs", since ?? "all"] as const,
};

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: serviceFinderKeys.all });
}

// ---------------------------------------------------------------------------
// Sorgular
// ---------------------------------------------------------------------------

export function useServiceFinderJobs(status?: string | null, page = 0, pageSize = 25) {
  return useQuery({
    queryKey: serviceFinderKeys.jobs(status, page),
    queryFn: () => listJobs({ status, limit: pageSize, offset: page * pageSize }),
    refetchInterval: (query) => {
      const jobs = query.state.data?.jobs ?? [];
      const hasActive = jobs.some((job) => job.status === "queued" || job.status === "running");
      return hasActive ? ACTIVE_POLL_MS : false;
    },
  });
}

export function useServiceFinderJobDetail(jobId: string | undefined) {
  return useQuery({
    queryKey: serviceFinderKeys.jobDetail(jobId ?? ""),
    queryFn: () => getJobDetail(jobId as string),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const detail = query.state.data as ServiceFinderJobDetail | undefined;
      const status = detail?.job?.status;
      return status === "queued" || status === "running" ? ACTIVE_POLL_MS : false;
    },
  });
}

export function useServiceFinderProviders() {
  return useQuery({
    queryKey: serviceFinderKeys.providers(),
    queryFn: fetchProviders,
  });
}

export function useServiceFinderTemplates() {
  return useQuery({
    queryKey: serviceFinderKeys.templates(),
    queryFn: fetchTemplates,
  });
}

export function useServiceFinderCostSummary(sinceIso?: string) {
  return useQuery({
    queryKey: serviceFinderKeys.costs(sinceIso),
    queryFn: () => fetchCostSummary(sinceIso),
  });
}

// ---------------------------------------------------------------------------
// Mutasyonlar
// ---------------------------------------------------------------------------

export function useCreateServiceFinderJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: JobCreateInput) => createJob(input),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("İş kuyruğa alındı");
    },
    onError: (err: Error) => {
      toast.error("İş oluşturulamadı", { description: sfErrorMessage(err) });
    },
  });
}

export function useCancelServiceFinderJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => cancelJob(jobId),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("İş iptal edildi");
    },
    onError: (err: Error) => {
      toast.error("İş iptal edilemedi", { description: sfErrorMessage(err) });
    },
  });
}

export function useRetryServiceFinderJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { jobId: string; patch?: { soft_cap_usd?: number; hard_cap_usd?: number } }) =>
      retryJob(args.jobId, args.patch),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("İş yeniden kuyruğa alındı");
    },
    onError: (err: Error) => {
      toast.error("İş yeniden başlatılamadı", { description: sfErrorMessage(err) });
    },
  });
}

export function useReviewServiceFinderCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      candidateId: string;
      action: "approved" | "rejected" | "needs_edit" | "pending";
      patch?: CandidatePatch;
    }) => reviewCandidate(args.candidateId, args.action, args.patch ?? {}),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Aday güncellendi");
    },
    onError: (err: Error) => {
      toast.error("Aday güncellenemedi", { description: sfErrorMessage(err) });
    },
  });
}

export function usePublishServiceFinderCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { candidateId: string; patch?: CandidatePatch }) =>
      publishCandidate(args.candidateId, args.patch ?? {}),
    onSuccess: (result) => {
      invalidateAll(qc);
      toast.success("Aday kataloğa yayınlandı", {
        description: `Katalog kaydı: ${result.catalog_item_id}`,
      });
    },
    onError: (err: Error) => {
      toast.error("Aday yayınlanamadı", { description: sfErrorMessage(err) });
    },
  });
}

export function useUpsertServiceFinderProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { providerId: string | null; patch: Partial<ServiceFinderProviderConfigRow> }) =>
      upsertProvider(args.providerId, args.patch),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Sağlayıcı ayarları kaydedildi");
    },
    onError: (err: Error) => {
      toast.error("Sağlayıcı kaydedilemedi", { description: sfErrorMessage(err) });
    },
  });
}

export function useUpsertServiceFinderTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { templateId: string | null; patch: Partial<ServiceFinderTemplateRow> }) =>
      upsertTemplate(args.templateId, args.patch),
    onSuccess: () => {
      invalidateAll(qc);
      toast.success("Şablon kaydedildi");
    },
    onError: (err: Error) => {
      toast.error("Şablon kaydedilemedi", { description: sfErrorMessage(err) });
    },
  });
}
