import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { DollarSign, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { Transaction } from "../types/accounting";

interface DashboardProps {
  transactions: Transaction[];
}

export function Dashboard({ transactions }: DashboardProps) {
  // Calculate totals
  const totals = transactions.reduce(
    (acc, transaction) => {
      transaction.entries.forEach(entry => {
        const amount = entry.amount;
        
        if (entry.gaapCategory === 'Assets') {
          acc.assets += entry.type === 'debit' ? amount : -amount;
        } else if (entry.gaapCategory === 'Liabilities') {
          acc.liabilities += entry.type === 'credit' ? amount : -amount;
        } else if (entry.gaapCategory === 'Equity') {
          acc.equity += entry.type === 'credit' ? amount : -amount;
        } else if (entry.gaapCategory === 'Revenue') {
          acc.revenue += entry.type === 'credit' ? amount : -amount;
        } else if (entry.gaapCategory === 'Expenses') {
          acc.expenses += entry.type === 'debit' ? amount : -amount;
        }
      });
      return acc;
    },
    { assets: 0, liabilities: 0, equity: 0, revenue: 0, expenses: 0 }
  );

  const netIncome = totals.revenue - totals.expenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-5 rounded-2xl"></div>
        <div className="relative bg-white border-l-4 border-primary shadow-sm p-6 rounded-xl">
          <h2 className="flex items-center gap-2">
            Financial Dashboard 
            <span className="text-2xl">🦍</span>
          </h2>
          <p className="text-muted-foreground">Complete overview of your financial position</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-xl border border-green-200 bg-gradient-to-br from-white to-green-50/30 p-6 shadow-sm transition-all hover:shadow-md hover:border-green-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-green-700 uppercase tracking-wide">Total Assets</span>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-3xl text-green-900">{formatCurrency(totals.assets)}</div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-purple-200 bg-gradient-to-br from-white to-purple-50/30 p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-purple-700 uppercase tracking-wide">Liabilities</span>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl text-purple-900">{formatCurrency(totals.liabilities)}</div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-blue-700 uppercase tracking-wide">Revenue</span>
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl text-blue-900">{formatCurrency(totals.revenue)}</div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-br from-white to-orange-50/30 p-6 shadow-sm transition-all hover:shadow-md hover:border-orange-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-orange-700 uppercase tracking-wide">Expenses</span>
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl text-orange-900">{formatCurrency(totals.expenses)}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Balance Sheet
                <span>🍌</span>
              </CardTitle>
              <PieChart className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="flex justify-between items-center p-4 rounded-lg bg-green-50 border-l-4 border-green-500">
              <span className="text-green-900">Assets</span>
              <span className="text-green-900">{formatCurrency(totals.assets)}</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-lg bg-purple-50 border-l-4 border-purple-500">
              <span className="text-purple-900">Liabilities</span>
              <span className="text-purple-900">{formatCurrency(totals.liabilities)}</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500">
              <span className="text-blue-900">Equity</span>
              <span className="text-blue-900">{formatCurrency(totals.equity)}</span>
            </div>
            <div className="pt-3 mt-3 border-t-2 flex justify-between items-center p-4 rounded-lg bg-slate-100">
              <span className="uppercase text-sm tracking-wide">L + E</span>
              <span>{formatCurrency(totals.liabilities + totals.equity)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Income Statement</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="flex justify-between items-center p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500">
              <span className="text-blue-900">Revenue</span>
              <span className="text-blue-900">{formatCurrency(totals.revenue)}</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-lg bg-orange-50 border-l-4 border-orange-500">
              <span className="text-orange-900">Expenses</span>
              <span className="text-orange-900">{formatCurrency(totals.expenses)}</span>
            </div>
            <div className="pt-3 mt-3 border-t-2 flex justify-between items-center p-4 rounded-lg bg-green-50 border-l-4 border-green-500">
              <span className="uppercase text-sm tracking-wide">Net Income</span>
              <span className={netIncome >= 0 ? 'text-green-700' : 'text-red-700'}>
                {formatCurrency(netIncome)} {netIncome >= 0 ? '🎉' : '⚠️'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
