// src/pages/admin/muhasebe/butce/ButcePage.test.tsx
import type React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ButcePage from '@/pages/admin/muhasebe/butce/ButcePage';
import { seedYear } from '@/lib/muhasebe-butce-schemas';

vi.mock('@/hooks/useMuhasebeButce', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useMuhasebeButce')>(
    '@/hooks/useMuhasebeButce',
  );
  return {
    ...actual,
    useButceYear: () => ({ data: seedYear(), isLoading: false }),
    useDebouncedButceSave: () => ({ save: vi.fn(), status: 'idle' }),
  };
});

function renderWithClient(ui: React.ReactElement) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('ButcePage', () => {
  it('renders the year selector and defaults to the Teknoloji tab', () => {
    renderWithClient(<ButcePage />);
    expect(screen.getByRole('combobox', { name: /Yıl/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Teknoloji & Altyapı' })).toBeInTheDocument();
  });

  it('switches to the Platform Gelirleri panel when its tab is clicked', async () => {
    renderWithClient(<ButcePage />);
    await userEvent.click(screen.getByRole('tab', { name: 'Gelirler' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Platform Gelirleri' })).toBeInTheDocument());
  });

  it('renders a CSV download button', () => {
    renderWithClient(<ButcePage />);
    expect(screen.getByRole('button', { name: /CSV indir/i })).toBeInTheDocument();
  });
});
