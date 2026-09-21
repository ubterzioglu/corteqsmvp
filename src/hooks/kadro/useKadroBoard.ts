import { useQuery } from "@tanstack/react-query";
import { fetchKadroRoleStates } from "@/lib/kadro/kadro-api";
import { resolveKadroRoles, filterKadroRoles, groupKadroRoles, summarizeKadroRoles, findOrphanStateKeys, KADRO_EMPTY_FILTERS } from "@/lib/kadro/kadro-view";
import type { KadroFilters } from "@/lib/kadro/kadro-view";
import { KADRO_ROLES } from "@/lib/kadro/roles";
import { useState, useMemo } from "react";

export const KADRO_QUERY_KEY = ["kadro", "role-states"] as const;

export function useKadroBoard() {
  const [filters, setFilters] = useState<KadroFilters>(KADRO_EMPTY_FILTERS);

  const { data: states, isLoading, error } = useQuery({
    queryKey: KADRO_QUERY_KEY,
    queryFn: fetchKadroRoleStates,
  });

  const resolvedRoles = useMemo(() => {
    return resolveKadroRoles(KADRO_ROLES, states ?? []);
  }, [states]);

  const filteredRoles = useMemo(() => {
    return filterKadroRoles(resolvedRoles, filters);
  }, [resolvedRoles, filters]);

  const groups = useMemo(() => {
    return groupKadroRoles(filteredRoles);
  }, [filteredRoles]);

  const summary = useMemo(() => {
    return summarizeKadroRoles(filteredRoles);
  }, [filteredRoles]);

  const orphanKeys = useMemo(() => {
    return findOrphanStateKeys(states ?? []);
  }, [states]);

  return {
    roles: resolvedRoles,
    filteredRoles,
    groups,
    summary,
    orphanKeys,
    filters,
    setFilters,
    isLoading,
    error,
  };
}
