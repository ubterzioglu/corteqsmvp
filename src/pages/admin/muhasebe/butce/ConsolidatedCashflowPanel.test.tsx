import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConsolidatedCashflowPanel } from '@/pages/admin/muhasebe/butce/ConsolidatedCashflowPanel';
import { seedYear } from '@/lib/muhasebe-butce-schemas';

describe('ConsolidatedCashflowPanel', () => {
  it('renders opening balance, fx params, and basis selector', () => {
    const state = seedYear();
    render(<ConsolidatedCashflowPanel state={state} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/Açılış nakit bakiyesi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/1 EUR/i)).toHaveValue(1.08);
    expect(screen.getByRole('combobox', { name: /Gider bazı/i })).toBeInTheDocument();
  });

  it('shows a 12-ay+ runway message when cumulative cash never goes negative', () => {
    const state = seedYear();
    render(<ConsolidatedCashflowPanel state={state} onChange={vi.fn()} />);
    expect(screen.getByText(/12\+ ay/i)).toBeInTheDocument();
  });

  it('calls onChange with the updated opening balance', async () => {
    const state = seedYear();
    const onChange = vi.fn();
    render(<ConsolidatedCashflowPanel state={state} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText(/Açılış nakit bakiyesi/i), '5000');
    const lastCall = onChange.mock.calls.at(-1)?.[0];
    expect(lastCall.opening).toBe(5000);
  });
});
