import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/muhasebe-butce-api', () => ({
  fetchButceYear: vi.fn(),
  upsertButceYear: vi.fn(),
}));

import { fetchButceYear, upsertButceYear } from '@/lib/muhasebe-butce-api';
import { useButceYear, useDebouncedButceSave, useSaveButceYear } from '@/hooks/useMuhasebeButce';
import { seedYear } from '@/lib/muhasebe-butce-schemas';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useButceYear', () => {
  it('returns a seeded year when the DB has no row yet', async () => {
    vi.mocked(fetchButceYear).mockResolvedValue(null);
    const { result } = renderHook(() => useButceYear(2026), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.basis).toBe('plan');
    expect(result.current.data?.expenses.tech).toHaveLength(6);
  });

  it('returns the stored year state when present', async () => {
    const stored = seedYear();
    vi.mocked(fetchButceYear).mockResolvedValue(stored);
    const { result } = renderHook(() => useButceYear(2027), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(stored);
  });
});

describe('useSaveButceYear', () => {
  it('calls upsertButceYear with the given year and state', async () => {
    vi.mocked(upsertButceYear).mockResolvedValue(undefined);
    const { result } = renderHook(() => useSaveButceYear(2026), { wrapper });
    const state = seedYear();
    await result.current.mutateAsync(state);
    expect(upsertButceYear).toHaveBeenCalledWith(2026, state);
  });
});

describe('useDebouncedButceSave', () => {
  it('debounces rapid save() calls into a single upsert', async () => {
    vi.useFakeTimers();
    vi.mocked(upsertButceYear).mockClear();
    vi.mocked(upsertButceYear).mockResolvedValue(undefined);
    const { result } = renderHook(() => useDebouncedButceSave(2026, 700), { wrapper });
    const state = seedYear();

    act(() => {
      result.current.save(state);
      result.current.save(state);
      result.current.save(state);
    });
    expect(upsertButceYear).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(700);
    });
    expect(upsertButceYear).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
