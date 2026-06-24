// Agent client — router + executor + verifier + telemetri sink'i tek giriş
// noktasında birleştirir. Çağrı noktaları (UI/edge) bu fabrikayı kullanır;
// böylece her araç çağrısı otomatik doğrulanır, injection taranır ve
// ops.tool_runs'a (redacted) kaydedilir.
//
// Kaynak tasarım: newtools.md §"Ajan orkestrasyonu" — tek tüketim API'si.

import { supabase } from "@/integrations/supabase/client";
import { toolCatalog } from "./tools-catalog.generated";
import {
  executeTool,
  type ExecuteResult,
  type ExecutorTool,
} from "./tool-executor";
import { createToolRunSink, type RpcCaller, type SinkOptions } from "./telemetry-sink";

type CatalogTool = {
  tool_key: string;
  tool_name: string;
  family: string;
  status: string;
  entrypoint?: string;
  input_schema?: { validation?: string; fields?: string[] };
};

const CATALOG_TOOLS = toolCatalog.tools as unknown as CatalogTool[];

/** Katalogtan tool_key ile araç metadata'sını bulur. */
export function findTool(toolKey: string): ExecutorTool | undefined {
  const t = CATALOG_TOOLS.find((x) => x.tool_key === toolKey);
  if (!t) return undefined;
  return {
    tool_key: t.tool_key,
    status: t.status,
    family: t.family,
    entrypoint: t.entrypoint,
    input_schema: t.input_schema,
  };
}

export type CallToolOptions = {
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  mutating?: boolean;
  redacted?: boolean;
  requiredFields?: string[];
};

export type AgentClientDeps = {
  /** Telemetri RPC çağrıcısı (varsayılan: canonical supabase client). */
  rpcCaller?: RpcCaller;
  sinkOptions?: SinkOptions;
  /** Edge function çağrısı (varsayılan: supabase.functions.invoke). */
  invokeEdge?: (
    name: string,
    payload: Record<string, unknown>,
  ) => Promise<{ httpStatus: number; body: unknown }>;
};

/** Supabase functions.invoke'u executor'ın beklediği şekle uyarlar. */
async function defaultInvokeEdge(
  name: string,
  payload: Record<string, unknown>,
): Promise<{ httpStatus: number; body: unknown }> {
  const { data, error } = await supabase.functions.invoke(name, { body: payload });
  if (error) {
    // FunctionsHttpError context'inden status alınmaya çalışılır.
    const status =
      (error as { context?: { status?: number } }).context?.status ?? 500;
    return { httpStatus: status, body: { error: error.message } };
  }
  return { httpStatus: 200, body: data };
}

/**
 * Agent client üretir. Döndürülen callTool, bir edge function aracını
 * doğrulayıp çalıştırır ve telemetriyi otomatik kaydeder.
 */
export function createAgentClient(deps: AgentClientDeps = {}) {
  const rpcCaller = deps.rpcCaller ?? (supabase as unknown as RpcCaller);
  const sink = createToolRunSink(rpcCaller, deps.sinkOptions);
  const invokeEdge = deps.invokeEdge ?? defaultInvokeEdge;

  return {
    /**
     * Bir edge function aracını tool_key ile çağırır. Bilinmeyen/edge-olmayan
     * araç → açık hata. Sonuç + telemetri executor tarafından üretilir.
     */
    async callTool(toolKey: string, opts: CallToolOptions): Promise<ExecuteResult> {
      const tool = findTool(toolKey);
      if (!tool) {
        throw new Error(`Bilinmeyen araç: ${toolKey}`);
      }
      if (tool.family !== "edge_function") {
        throw new Error(`callTool yalnız edge_function destekler: ${toolKey} (${tool.family}).`);
      }
      const toolName = tool.entrypoint?.split("/")[2] ?? toolKey.replace(/^edge\./, "");
      return executeTool(tool, {
        payload: opts.payload,
        idempotencyKey: opts.idempotencyKey,
        mutating: opts.mutating,
        redacted: opts.redacted,
        requiredFields: opts.requiredFields,
        invoke: (payload) => invokeEdge(toolName, payload),
        sink,
      });
    },
  };
}
