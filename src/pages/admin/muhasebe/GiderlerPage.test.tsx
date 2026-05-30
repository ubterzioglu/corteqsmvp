import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GiderlerPage from '@/pages/admin/muhasebe/GiderlerPage';

vi.mock('@/hooks/useMuhasebe', () => ({
  useExpenses: () => ({
    data: [
      {
        id: 'exp-1',
        expense_date: '2026-05-01',
        person: 'burak',
        category: 'hosting_sunucu',
        description: 'AWS',
        amount: 100,
        currency: 'USD',
        status: 'odendi',
        payment_method: null,
        invoice_url: null,
        note: null,
        is_virtual_card: false,
        created_at: '',
        updated_at: '',
        created_by: null,
      },
      {
        id: 'exp-2',
        expense_date: '2026-05-02',
        person: 'baris',
        category: 'muhasebe_finans',
        description: 'Muhasebe',
        amount: 2500,
        currency: 'TRY',
        status: 'bekliyor',
        payment_method: null,
        invoice_url: null,
        note: null,
        is_virtual_card: false,
        created_at: '',
        updated_at: '',
        created_by: null,
      },
    ],
    isLoading: false,
  }),
  useCreateExpense: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateExpense: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useDeleteExpense: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

describe('GiderlerPage', () => {
  it('shows filtered totals separated by currency in the filter summary', () => {
    render(<GiderlerPage />);

    expect(screen.getByText(/Toplamlar:/i)).toBeInTheDocument();
    expect(screen.getByText(/TRY: 2\.500,00 TRY/i)).toBeInTheDocument();
    expect(screen.getByText(/USD: 100,00 USD/i)).toBeInTheDocument();
    expect(screen.queryByText(/EUR:/i)).not.toBeInTheDocument();
  });
});
