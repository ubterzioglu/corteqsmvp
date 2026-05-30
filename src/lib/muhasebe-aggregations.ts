import {
  CURRENCY_CODES,
  type CashflowMonthByCurrency,
  type CategorySummaryByCurrency,
  type CurrencyCode,
  type CurrencyTotals,
  type ExpenseCategory,
  type ExpenseRow,
  type IncomeRow,
  type MuhasebeKpiSummary,
  type PersonSummaryByCurrency,
  type PersonType,
} from '@/types/muhasebe';

function emptyCurrencyTotals(): CurrencyTotals {
  return Object.fromEntries(
    CURRENCY_CODES.map((currency) => [currency, 0]),
  ) as CurrencyTotals;
}

function addToCurrencyTotals(
  totals: CurrencyTotals,
  currency: CurrencyCode,
  amount: number,
): void {
  totals[currency] += Number(amount) || 0;
}

export function aggregateCurrencyTotals(
  rows: Array<{ currency: CurrencyCode; amount: number }>,
): CurrencyTotals {
  return rows.reduce((acc, row) => {
    addToCurrencyTotals(acc, row.currency, row.amount);
    return acc;
  }, emptyCurrencyTotals());
}

export function getCurrencyTotal(
  totals: CurrencyTotals,
  currency: CurrencyCode,
): number {
  return totals[currency] ?? 0;
}

export function aggregateKpiSummary(
  expenses: ExpenseRow[],
  incomes: IncomeRow[],
): MuhasebeKpiSummary {
  const total_expense_by_currency = aggregateCurrencyTotals(expenses);
  const total_income_by_currency = aggregateCurrencyTotals(incomes);
  const pending_expense_by_currency = aggregateCurrencyTotals(
    expenses.filter((row) => row.status === 'bekliyor'),
  );
  const pending_income_by_currency = aggregateCurrencyTotals(
    incomes.filter((row) => row.status === 'bekliyor'),
  );
  const net_by_currency = emptyCurrencyTotals();

  CURRENCY_CODES.forEach((currency) => {
    net_by_currency[currency] =
      total_income_by_currency[currency] - total_expense_by_currency[currency];
  });

  return {
    total_expense_by_currency,
    total_income_by_currency,
    net_by_currency,
    pending_expense_by_currency,
    pending_income_by_currency,
    total_records: expenses.length + incomes.length,
  };
}

export function aggregateExpenseByPerson(
  expenses: ExpenseRow[],
): PersonSummaryByCurrency[] {
  const people: PersonType[] = ['burak', 'baris', 'ortak'];

  return people.map((person) => {
    const personExpenses = expenses.filter((row) => row.person === person);

    return {
      person,
      record_count: personExpenses.length,
      total_by_currency: aggregateCurrencyTotals(personExpenses),
      paid_by_currency: aggregateCurrencyTotals(
        personExpenses.filter((row) => row.status === 'odendi'),
      ),
      pending_by_currency: aggregateCurrencyTotals(
        personExpenses.filter((row) => row.status === 'bekliyor'),
      ),
    };
  });
}

export function aggregateExpenseByCategory(
  expenses: ExpenseRow[],
  categories: ExpenseCategory[],
): CategorySummaryByCurrency[] {
  return categories.map((category) => {
    const categoryExpenses = expenses.filter((row) => row.category === category);

    return {
      category,
      record_count: categoryExpenses.length,
      total_by_currency: aggregateCurrencyTotals(categoryExpenses),
    };
  });
}

export function aggregateCashflowMonthly(
  expenses: ExpenseRow[],
  incomes: IncomeRow[],
  yearNum: number,
): CashflowMonthByCurrency[] {
  const months = Array.from({ length: 12 }, (_, index) => ({
    year_num: yearNum,
    month_num: index + 1,
    income_by_currency: emptyCurrencyTotals(),
    expense_by_currency: emptyCurrencyTotals(),
    net_by_currency: emptyCurrencyTotals(),
    burak_expense_by_currency: emptyCurrencyTotals(),
    baris_expense_by_currency: emptyCurrencyTotals(),
    ortak_expense_by_currency: emptyCurrencyTotals(),
    expense_paid_by_currency: emptyCurrencyTotals(),
    expense_pending_by_currency: emptyCurrencyTotals(),
    income_collected_by_currency: emptyCurrencyTotals(),
    income_pending_by_currency: emptyCurrencyTotals(),
  }));

  expenses.forEach((row) => {
    const date = new Date(row.expense_date);
    if (date.getFullYear() !== yearNum) return;

    const month = months[date.getMonth()];
    addToCurrencyTotals(month.expense_by_currency, row.currency, row.amount);

    if (row.person === 'burak') {
      addToCurrencyTotals(month.burak_expense_by_currency, row.currency, row.amount);
    } else if (row.person === 'baris') {
      addToCurrencyTotals(month.baris_expense_by_currency, row.currency, row.amount);
    } else {
      addToCurrencyTotals(month.ortak_expense_by_currency, row.currency, row.amount);
    }

    if (row.status === 'odendi') {
      addToCurrencyTotals(month.expense_paid_by_currency, row.currency, row.amount);
    }
    if (row.status === 'bekliyor') {
      addToCurrencyTotals(month.expense_pending_by_currency, row.currency, row.amount);
    }
  });

  incomes.forEach((row) => {
    const date = new Date(row.income_date);
    if (date.getFullYear() !== yearNum) return;

    const month = months[date.getMonth()];
    addToCurrencyTotals(month.income_by_currency, row.currency, row.amount);

    if (row.status === 'tahsil_edildi') {
      addToCurrencyTotals(month.income_collected_by_currency, row.currency, row.amount);
    }
    if (row.status === 'bekliyor') {
      addToCurrencyTotals(month.income_pending_by_currency, row.currency, row.amount);
    }
  });

  months.forEach((month) => {
    CURRENCY_CODES.forEach((currency) => {
      month.net_by_currency[currency] =
        month.income_by_currency[currency] - month.expense_by_currency[currency];
    });
  });

  return months;
}
