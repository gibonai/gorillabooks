export type TransactionType = 'income' | 'expense';

export interface Transaction {
  _id: string;
  userId: string;
  date: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  vendor?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

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
];

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
];
