export interface Client {
  id: string;
  code: string;
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  balance: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientInput {
  code: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  balance?: number;
  active?: boolean;
}

export interface Importer {
  id: string;
  name: string;
  cnpj?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImporterInput {
  name: string;
  cnpj?: string;
  active?: boolean;
}

export interface BankAccount {
  id: string;
  name: string;
  bank?: string | null;
  agency?: string | null;
  account?: string | null;
  balance: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankAccountInput {
  name: string;
  bank?: string;
  balance?: number;
  active?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategoryInput {
  name: string;
  description?: string;
  active?: boolean;
}

export interface Process {
  id: string;
  reference: string; // Format: XXXX.XXX.XXXX.XX
  client_id: string;
  importer_id?: string | null;
  status: 'open' | 'finalized' | 'billed';
  finalized_at?: string | null;
  billed_at?: string | null;
  billing_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessInput {
  reference: string;
  client_id: string;
  importer_id?: string;
  status?: 'open' | 'finalized' | 'billed';
  finalized_at?: string;
  billed_at?: string;
  billing_notes?: string;
}

export interface ProcessWithRelations extends Process {
  client?: Client;
  importer?: Importer;
}

export interface Deposit {
  id: string;
  client_id: string;
  bank_account_id: string;
  amount: number;
  date: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepositInput {
  client_id: string;
  bank_account_id: string;
  amount: number;
  date: string;
  description?: string;
}

export interface DepositWithRelations extends Deposit {
  client?: Client;
  bank_account?: BankAccount;
}

export interface Expense {
  id: string;
  process_id: string;
  category_id: string;
  bank_account_id: string;
  amount: number;
  date: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInput {
  process_id: string;
  category_id: string;
  bank_account_id: string;
  amount: number;
  date: string;
  description?: string;
}

export interface ExpenseWithRelations extends Expense {
  process?: ProcessWithRelations;
  category?: ExpenseCategory;
  bank_account?: BankAccount;
}

export type TransactionType = 'deposit' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string | null;
  client?: Client;
  process?: ProcessWithRelations;
  category?: ExpenseCategory;
  bank_account?: BankAccount;
  created_at: string;
}
