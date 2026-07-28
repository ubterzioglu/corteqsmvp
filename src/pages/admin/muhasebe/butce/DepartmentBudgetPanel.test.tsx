import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DepartmentBudgetPanel } from '@/pages/admin/muhasebe/butce/DepartmentBudgetPanel';
import { seedYear } from '@/lib/muhasebe-butce-schemas';

// jsdom Pointer Events API'sini implement etmez; Radix UI Select (Alokasyon modu
// combobox'ı) pointerdown sırasında hasPointerCapture/setPointerCapture/
// releasePointerCapture çağırır. Bu test dosyasına özel minimal polyfill.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

describe('DepartmentBudgetPanel', () => {
  it('renders the department name, its seed expense items, and add-item button', () => {
    const state = seedYear();
    render(<DepartmentBudgetPanel deptId="tech" state={state} onChange={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Teknoloji & Altyapı' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Lovable aboneliği')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Kalem ekle/i })).toBeInTheDocument();
  });

  it('calls onChange with an added expense item when "Kalem ekle" is clicked', async () => {
    const state = seedYear();
    const onChange = vi.fn();
    render(<DepartmentBudgetPanel deptId="tech" state={state} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /Kalem ekle/i }));
    const next = onChange.mock.calls[0][0];
    expect(next.expenses.tech).toHaveLength(state.expenses.tech.length + 1);
  });

  it('calls onChange with the item removed when its delete button is clicked', async () => {
    const state = seedYear();
    const onChange = vi.fn();
    render(<DepartmentBudgetPanel deptId="tech" state={state} onChange={onChange} />);
    const deleteButtons = screen.getAllByRole('button', { name: /Kalemi sil/i });
    await userEvent.click(deleteButtons[0]);
    const next = onChange.mock.calls[0][0];
    expect(next.expenses.tech).toHaveLength(state.expenses.tech.length - 1);
  });

  it('switches allocation mode to percentage and updates state', async () => {
    const state = seedYear();
    const onChange = vi.fn();
    render(<DepartmentBudgetPanel deptId="tech" state={state} onChange={onChange} />);
    await userEvent.click(screen.getByRole('combobox', { name: /Alokasyon modu/i }));
    await userEvent.click(await screen.findByRole('option', { name: /Net gelirin/i }));
    const next = onChange.mock.calls[0][0];
    expect(next.alloc.tech.mode).toBe('pct');
  });
});
