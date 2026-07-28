import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MonthRow } from '@/components/admin/muhasebe/BudgetMonthTable';

describe('MonthRow', () => {
  it('renders 12 month inputs with the given values', () => {
    render(
      <table>
        <tbody>
          <tr>
            <MonthRow
              values={[100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
              onChange={vi.fn()}
              ariaLabelPrefix="Test"
            />
          </tr>
        </tbody>
      </table>,
    );
    expect(screen.getAllByRole('spinbutton')).toHaveLength(12);
    expect(screen.getByLabelText('Test Oca')).toHaveValue(100);
  });

  it('calls onChange with the month index and numeric value on input', async () => {
    // MonthRow is a controlled input (value driven by props.values), matching real usage in
    // DepartmentBudgetPanel/RevenuePanel where the parent re-renders with the updated value on
    // every keystroke. A bare vi.fn() that never updates `values` causes React to revert the DOM
    // value after each keystroke, so this harness mirrors the real stateful-parent contract.
    const onChange = vi.fn();
    function Harness() {
      const [values, setValues] = useState<number[]>(Array(12).fill(0));
      return (
        <table>
          <tbody>
            <tr>
              <MonthRow
                values={values}
                ariaLabelPrefix="Test"
                onChange={(month, value) => {
                  onChange(month, value);
                  setValues((prev) => prev.map((v, m) => (m === month ? value : v)));
                }}
              />
            </tr>
          </tbody>
        </table>
      );
    }
    render(<Harness />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Test Şub'), '250');
    expect(onChange).toHaveBeenLastCalledWith(1, 250);
  });
});
