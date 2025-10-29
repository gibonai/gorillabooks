// User-friendly categories for startups

export const INCOME_CATEGORIES = [
  'Product Sales',
  'Service Revenue',
  'Consulting',
  'Subscription Revenue',
  'License Fees',
  'Investment/Funding',
  'Loan',
  'Refund',
  'Other Income',
] as const;

export const EXPENSE_CATEGORIES = [
  // People
  'Salaries & Wages',
  'Contractor Payments',
  'Benefits & Insurance',

  // Operations
  'Rent & Facilities',
  'Utilities',
  'Office Supplies',
  'Equipment',

  // Technology
  'Software & SaaS',
  'Cloud Services (AWS/Azure/GCP)',
  'Domain & Hosting',

  // Marketing & Sales
  'Advertising',
  'Marketing & Promotion',
  'Travel & Entertainment',

  // Professional Services
  'Legal Fees',
  'Accounting & Bookkeeping',
  'Consulting',

  // Business Operations
  'Bank Fees',
  'Interest & Loan Payments',
  'Insurance',
  'Taxes',

  // Other
  'Refund to Customer',
  'Other Expense',
] as const;

export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
