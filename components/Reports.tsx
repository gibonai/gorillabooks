import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Transaction, GAAPCategory } from "../types/accounting";

interface ReportsProps {
  transactions: Transaction[];
}

export function Reports({ transactions }: ReportsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate account balances
  const accountBalances = transactions.reduce((acc, transaction) => {
    transaction.entries.forEach(entry => {
      const key = `${entry.gaapCategory}:${entry.gaapSubcategory}`;
      if (!acc[key]) {
        acc[key] = {
          category: entry.gaapCategory,
          account: entry.gaapSubcategory,
          debits: 0,
          credits: 0,
          balance: 0
        };
      }
      
      if (entry.type === 'debit') {
        acc[key].debits += entry.amount;
      } else {
        acc[key].credits += entry.amount;
      }
      
      // Calculate normal balance based on account type
      if (['Assets', 'Expenses'].includes(entry.gaapCategory)) {
        acc[key].balance = acc[key].debits - acc[key].credits;
      } else {
        acc[key].balance = acc[key].credits - acc[key].debits;
      }
    });
    return acc;
  }, {} as Record<string, { category: GAAPCategory; account: string; debits: number; credits: number; balance: number }>);

  const accounts = Object.values(accountBalances);

  // Calculate totals by category
  const categoryTotals = accounts.reduce((acc, account) => {
    if (!acc[account.category]) {
      acc[account.category] = 0;
    }
    acc[account.category] += account.balance;
    return acc;
  }, {} as Record<GAAPCategory, number>);

  const assets = categoryTotals.Assets || 0;
  const liabilities = categoryTotals.Liabilities || 0;
  const equity = categoryTotals.Equity || 0;
  const revenue = categoryTotals.Revenue || 0;
  const expenses = categoryTotals.Expenses || 0;
  const netIncome = revenue - expenses;

  // Balance Sheet accounts
  const balanceSheetAccounts = accounts.filter(a => 
    ['Assets', 'Liabilities', 'Equity'].includes(a.category)
  );

  // Income Statement accounts
  const incomeStatementAccounts = accounts.filter(a => 
    ['Revenue', 'Expenses'].includes(a.category)
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-5 rounded-2xl"></div>
        <div className="relative bg-white border-l-4 border-blue-500 shadow-sm p-6 rounded-xl">
          <h2 className="flex items-center gap-2">
            Financial Reports
            <span className="text-2xl">📊</span>
          </h2>
          <p className="text-muted-foreground">GAAP-compliant financial statements</p>
        </div>
      </div>

      <Tabs defaultValue="trial-balance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="trial-balance" className="py-3">
            Trial Balance
          </TabsTrigger>
          <TabsTrigger value="balance-sheet" className="py-3">
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="income-statement" className="py-3">
            Income Statement
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance" className="space-y-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="flex items-center gap-2">
                Trial Balance
                <span>⚖️</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {accounts.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="text-7xl">🦍</div>
                  <div>
                    <h3 className="text-muted-foreground">No accounts to display</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add transactions to see the trial balance
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead>Account</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Debits</TableHead>
                        <TableHead className="text-right">Credits</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts
                        .sort((a, b) => {
                          const categoryOrder: Record<GAAPCategory, number> = {
                            Assets: 1,
                            Liabilities: 2,
                            Equity: 3,
                            Revenue: 4,
                            Expenses: 5
                          };
                          return categoryOrder[a.category] - categoryOrder[b.category];
                        })
                        .map((account, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{account.account}</TableCell>
                            <TableCell>
                              <span className="inline-flex px-2 py-1 rounded-md text-xs bg-slate-100">
                                {account.category}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-blue-700">{formatCurrency(account.debits)}</TableCell>
                            <TableCell className="text-right text-purple-700">{formatCurrency(account.credits)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(Math.abs(account.balance))}</TableCell>
                          </TableRow>
                        ))}
                      <TableRow className="bg-slate-50 border-t-2">
                        <TableCell colSpan={2} className="uppercase text-xs tracking-wide">Total</TableCell>
                        <TableCell className="text-right text-blue-900">
                          {formatCurrency(accounts.reduce((sum, a) => sum + a.debits, 0))}
                        </TableCell>
                        <TableCell className="text-right text-purple-900">
                          {formatCurrency(accounts.reduce((sum, a) => sum + a.credits, 0))}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet" className="space-y-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="flex items-center gap-2">
                Balance Sheet
                <span>📋</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {balanceSheetAccounts.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="text-7xl">🦍</div>
                  <div>
                    <h3 className="text-muted-foreground">No balance sheet accounts</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add transactions to see the balance sheet
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-5 bg-gradient-to-br from-green-50 to-white rounded-xl border-l-4 border-green-500">
                    <h3 className="mb-4 flex items-center gap-2 text-green-900">
                      Assets
                      <span>💰</span>
                    </h3>
                    <div className="space-y-2">
                      {balanceSheetAccounts
                        .filter(a => a.category === 'Assets')
                        .map((account, idx) => (
                          <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                            <span className="text-sm">{account.account}</span>
                            <span className="text-sm text-green-900">{formatCurrency(account.balance)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-3 mt-2 border-t-2 border-green-200 bg-green-50/50 -mx-5 px-5">
                        <span className="uppercase text-xs tracking-wide">Total Assets</span>
                        <span>{formatCurrency(assets)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-purple-50 to-white rounded-xl border-l-4 border-purple-500">
                    <h3 className="mb-4 flex items-center gap-2 text-purple-900">
                      Liabilities
                      <span>📊</span>
                    </h3>
                    <div className="space-y-2">
                      {balanceSheetAccounts
                        .filter(a => a.category === 'Liabilities')
                        .map((account, idx) => (
                          <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                            <span className="text-sm">{account.account}</span>
                            <span className="text-sm text-purple-900">{formatCurrency(account.balance)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-3 mt-2 border-t-2 border-purple-200 bg-purple-50/50 -mx-5 px-5">
                        <span className="uppercase text-xs tracking-wide">Total Liabilities</span>
                        <span>{formatCurrency(liabilities)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-xl border-l-4 border-blue-500">
                    <h3 className="mb-4 flex items-center gap-2 text-blue-900">
                      Equity
                      <span>💼</span>
                    </h3>
                    <div className="space-y-2">
                      {balanceSheetAccounts
                        .filter(a => a.category === 'Equity')
                        .map((account, idx) => (
                          <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                            <span className="text-sm">{account.account}</span>
                            <span className="text-sm text-blue-900">{formatCurrency(account.balance)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-3 mt-2 border-t-2 border-blue-200 bg-blue-50/50 -mx-5 px-5">
                        <span className="uppercase text-xs tracking-wide">Total Equity</span>
                        <span>{formatCurrency(equity)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-slate-100 rounded-xl border-2 border-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="uppercase text-sm tracking-wide">Total Liabilities + Equity</span>
                      <span className="text-xl">{formatCurrency(liabilities + equity)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income-statement" className="space-y-4">
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="flex items-center gap-2">
                Income Statement
                <span>💹</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {incomeStatementAccounts.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                  <div className="text-7xl">🦍</div>
                  <div>
                    <h3 className="text-muted-foreground">No income statement accounts</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add transactions to see the income statement
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-xl border-l-4 border-blue-500">
                    <h3 className="mb-4 flex items-center gap-2 text-blue-900">
                      Revenue
                      <span>📈</span>
                    </h3>
                    <div className="space-y-2">
                      {incomeStatementAccounts
                        .filter(a => a.category === 'Revenue')
                        .map((account, idx) => (
                          <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                            <span className="text-sm">{account.account}</span>
                            <span className="text-sm text-blue-900">{formatCurrency(account.balance)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-3 mt-2 border-t-2 border-blue-200 bg-blue-50/50 -mx-5 px-5">
                        <span className="uppercase text-xs tracking-wide">Total Revenue</span>
                        <span>{formatCurrency(revenue)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-orange-50 to-white rounded-xl border-l-4 border-orange-500">
                    <h3 className="mb-4 flex items-center gap-2 text-orange-900">
                      Expenses
                      <span>📉</span>
                    </h3>
                    <div className="space-y-2">
                      {incomeStatementAccounts
                        .filter(a => a.category === 'Expenses')
                        .map((account, idx) => (
                          <div key={idx} className="flex justify-between py-2 border-b last:border-0">
                            <span className="text-sm">{account.account}</span>
                            <span className="text-sm text-orange-900">{formatCurrency(account.balance)}</span>
                          </div>
                        ))}
                      <div className="flex justify-between py-3 mt-2 border-t-2 border-orange-200 bg-orange-50/50 -mx-5 px-5">
                        <span className="uppercase text-xs tracking-wide">Total Expenses</span>
                        <span>{formatCurrency(expenses)}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-5 rounded-xl border-l-4 ${netIncome >= 0 ? 'bg-gradient-to-br from-green-50 to-white border-green-500' : 'bg-gradient-to-br from-red-50 to-white border-red-500'}`}>
                    <div className="flex justify-between items-center">
                      <span className="uppercase text-sm tracking-wide flex items-center gap-2">
                        Net Income
                        {netIncome >= 0 ? '🎉' : '⚠️'}
                      </span>
                      <span className={`text-2xl ${netIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(netIncome)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
