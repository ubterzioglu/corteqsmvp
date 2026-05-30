import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { formatCurrency } from '@/lib/muhasebe-format';
import NakitAkisiPage from '@/pages/admin/muhasebe/NakitAkisiPage';

vi.mock('@/components/ui/tabs', async () => {
  const React = await import('react');
  const TabsContext = React.createContext<{ onValueChange?: (value: string) => void }>({});

  return {
    Tabs: ({
      value,
      onValueChange,
      children,
    }: React.PropsWithChildren<{
      value?: string;
      onValueChange?: (value: string) => void;
    }>) => (
      <TabsContext.Provider value={{ onValueChange }}>
        <div data-value={value}>{children}</div>
      </TabsContext.Provider>
    ),
    TabsList: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    TabsTrigger: ({
      value,
      children,
    }: React.PropsWithChildren<{ value: string }>) => {
      const context = React.useContext(TabsContext);
      return (
        <button role="tab" type="button" onClick={() => context.onValueChange?.(value)}>
          {children}
        </button>
      );
    },
  };
});

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
        amount: 2000,
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
  useIncomes: () => ({
    data: [
      {
        id: 'inc-1',
        income_date: '2026-05-03',
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
        income_date: '2026-05-04',
        source: 'Grant',
        category: 'hibe_grant',
        description: 'Grant tranche',
        amount: 5000,
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
}));

describe('NakitAkisiPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('updates pivot totals when the selected currency changes', () => {
    render(<NakitAkisiPage />);

    expect(screen.getByText(/Aylık özet · TRY işlemleri üzerinden hesaplanır/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(formatCurrency(5000, 'TRY', { minimumFractionDigits: 0 })).length,
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('tab', { name: 'USD' }));

    expect(screen.getByText(/Aylık özet · USD işlemleri üzerinden hesaplanır/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(formatCurrency(150, 'USD', { minimumFractionDigits: 0 })).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(formatCurrency(50, 'USD', { minimumFractionDigits: 0 })).length,
    ).toBeGreaterThan(0);
  });
});
