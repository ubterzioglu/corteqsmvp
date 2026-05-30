import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GelirlerPage from '@/pages/admin/muhasebe/GelirlerPage';

vi.mock('@/hooks/useMuhasebe', () => ({
  useIncomes: () => ({
    data: [
      {
        id: 'inc-1',
        income_date: '2026-05-01',
        source: 'Pilot',
        category: 'pilot_gelir',
        description: 'Pilot payment',
        amount: 150,
        currency: 'USD',
        status: 'tahsil_edildi',
        link: null,
        note: null,
        created_at: '',
        updated_at: '',
        created_by: null,
      },
      {
        id: 'inc-2',
        income_date: '2026-05-02',
        source: 'Grant',
        category: 'hibe_grant',
        description: 'Grant tranche',
        amount: 4000,
        currency: 'TRY',
        status: 'bekliyor',
        link: null,
        note: null,
        created_at: '',
        updated_at: '',
        created_by: null,
      },
    ],
    isLoading: false,
  }),
  useCreateIncome: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateIncome: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDeleteIncome: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

describe('GelirlerPage', () => {
  it('shows separated totals for the visible income currencies', () => {
    render(<GelirlerPage />);

    expect(screen.getByText(/Toplamlar:/i)).toBeInTheDocument();
    expect(screen.getByText(/TRY: 4\.000,00 TRY/i)).toBeInTheDocument();
    expect(screen.getByText(/USD: 150,00 USD/i)).toBeInTheDocument();
    expect(screen.queryByText(/GBP:/i)).not.toBeInTheDocument();
  });
});
