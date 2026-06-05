import { useQuery } from "@tanstack/react-query";
import { listGeoCities, listGeoCitiesForCountries, listGeoCountries } from "@/lib/geo";

export function useGeoCountries(enabled = true) {
  return useQuery({
    queryKey: ["geo", "countries"],
    queryFn: listGeoCountries,
    staleTime: 1000 * 60 * 60,
    enabled,
  });
}

export function useGeoCities(countryNameOrCode: string, enabled = true) {
  return useQuery({
    queryKey: ["geo", "cities", countryNameOrCode],
    queryFn: () => listGeoCities(countryNameOrCode),
    staleTime: 1000 * 60 * 30,
    enabled: enabled && Boolean(countryNameOrCode.trim()),
  });
}

export function useGeoCitiesForCountries(countryNamesOrCodes: string[], enabled = true) {
  const normalizedKey = countryNamesOrCodes
    .map((value) => value.trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "tr"));

  return useQuery({
    queryKey: ["geo", "cities-by-country", normalizedKey],
    queryFn: () => listGeoCitiesForCountries(normalizedKey),
    staleTime: 1000 * 60 * 15,
    enabled: enabled && normalizedKey.length > 0,
  });
}
