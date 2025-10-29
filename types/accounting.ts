export type GAAPCategory = 'Assets' | 'Liabilities' | 'Equity' | 'Revenue' | 'Expenses';

export interface AccountingEntry {
  id: string;
  type: 'debit' | 'credit';
  gaapCategory: GAAPCategory;
  gaapSubcategory: string;
  amount: number;
  vendor?: string;
  tags?: string[];
  notes?: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  entries: AccountingEntry[];
  createdAt: string;
}

export const GAAP_ACCOUNTS = {
  Assets: [
    'Cash',
    'Accounts Receivable',
    'Inventory',
    'Prepaid Expenses',
    'Property, Plant & Equipment',
    'Intangible Assets',
    'Other Assets'
  ],
  Liabilities: [
    'Accounts Payable',
    'Accrued Expenses',
    'Short-term Debt',
    'Long-term Debt',
    'Deferred Revenue',
    'Other Liabilities'
  ],
  Equity: [
    'Common Stock',
    'Retained Earnings',
    'Additional Paid-in Capital',
    'Treasury Stock',
    'Other Equity'
  ],
  Revenue: [
    'Product Revenue',
    'Service Revenue',
    'Interest Income',
    'Other Income'
  ],
  Expenses: [
    'Cost of Goods Sold',
    'Salaries & Wages',
    'Rent',
    'Utilities',
    'Marketing & Advertising',
    'Professional Services',
    'Technology & Software',
    'Depreciation',
    'Interest Expense',
    'Other Expenses'
  ]
};
