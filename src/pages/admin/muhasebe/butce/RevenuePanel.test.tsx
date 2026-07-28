// src/pages/admin/muhasebe/butce/RevenuePanel.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RevenuePanel } from '@/pages/admin/muhasebe/butce/RevenuePanel';
import { seedYear } from '@/lib/muhasebe-butce-schemas';

describe('RevenuePanel', () => {
  it('renders the seeded revenue rows and add-item button', () => {
    const state = seedYear();
    render(<RevenuePanel state={state} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('Subscription')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Ana sponsor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gelir kalemi ekle/i })).toBeInTheDocument();
  });

  it('calls onChange with an added revenue item', async () => {
    const state = seedYear();
    const onChange = vi.fn();
    render(<RevenuePanel state={state} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Gelir kalemi ekle/i }));
    const next = onChange.mock.calls[0][0];
    expect(next.revenue).toHaveLength(state.revenue.length + 1);
  });

  it('calls onChange with the item removed when its delete button is clicked', async () => {
    const state = seedYear();
    const onChange = vi.fn();
    render(<RevenuePanel state={state} onChange={onChange} />);
    const deleteButtons = screen.getAllByRole('button', { name: /Kalemi sil/i });
    await userEvent.click(deleteButtons[0]);
    const next = onChange.mock.calls[0][0];
    expect(next.revenue).toHaveLength(state.revenue.length - 1);
  });
});
