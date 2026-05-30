import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { formatCurrency } from '@/lib/muhasebe-format';
import MuhasebeDashboard from '@/pages/admin/muhasebe/MuhasebeDashboard';

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

describe('MuhasebeDashboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-04T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('switches dashboard totals and tables when the currency tab changes', () => {
    render(<MuhasebeDashboard />);

    expect(screen.getAllByText(formatCurrency(2000, 'TRY')).length).toBeGreaterThan(0);
    expect(screen.getByText(/Toplam Gider \(TRY\)/i)).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'USD' }));

    expect(screen.getAllByText(formatCurrency(100, 'USD')).length).toBeGreaterThan(0);
    expect(screen.getByText(/Toplam Gider \(USD\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(formatCurrency(50, 'USD')).length).toBeGreaterThan(0);
  });
});
