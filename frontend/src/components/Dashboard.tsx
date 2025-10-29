import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { Transaction } from "@/types";

interface DashboardProps {
  transactions: Transaction[];
}

export function Dashboard({ transactions }: DashboardProps) {
  // Calculate simple totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = totalIncome - totalExpenses;

  // Calculate top spending categories
  const categoryTotals = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

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
          <h2>Financial Dashboard</h2>
          <p className="text-muted-foreground">Simple overview of your income and expenses</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="group relative overflow-hidden rounded-xl border border-green-200 bg-gradient-to-br from-white to-green-50/30 p-6 shadow-sm transition-all hover:shadow-md hover:border-green-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-green-700 uppercase tracking-wide">Money In</span>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-3xl text-green-900">{formatCurrency(totalIncome)}</div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-white to-red-50/30 p-6 shadow-sm transition-all hover:shadow-md hover:border-red-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-red-700 uppercase tracking-wide">Money Out</span>
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="text-3xl text-red-900">{formatCurrency(totalExpenses)}</div>
          </div>
        </div>

        <div className={`group relative overflow-hidden rounded-xl border p-6 shadow-sm transition-all hover:shadow-md ${
          netIncome >= 0
            ? 'border-blue-200 bg-gradient-to-br from-white to-blue-50/30 hover:border-blue-300'
            : 'border-orange-200 bg-gradient-to-br from-white to-orange-50/30 hover:border-orange-300'
        }`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 ${
            netIncome >= 0 ? 'bg-blue-500/5' : 'bg-orange-500/5'
          }`}></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm uppercase tracking-wide ${
                netIncome >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>
                {netIncome >= 0 ? 'Net Profit' : 'Net Loss'}
              </span>
              <div className={`p-2 rounded-lg ${
                netIncome >= 0 ? 'bg-blue-100' : 'bg-orange-100'
              }`}>
                <DollarSign className={`h-5 w-5 ${
                  netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
              </div>
            </div>
            <div className={`text-3xl ${
              netIncome >= 0 ? 'text-blue-900' : 'text-orange-900'
            }`}>
              {formatCurrency(Math.abs(netIncome))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Income Summary</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="flex justify-between items-center p-4 rounded-lg bg-green-50 border-l-4 border-green-500">
              <span className="text-green-900">Total Income</span>
              <span className="text-green-900 font-semibold">{formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-lg bg-red-50 border-l-4 border-red-500">
              <span className="text-red-900">Total Expenses</span>
              <span className="text-red-900 font-semibold">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className={`pt-3 mt-3 border-t-2 flex justify-between items-center p-4 rounded-lg border-l-4 ${
              netIncome >= 0
                ? 'bg-blue-50 border-blue-500'
                : 'bg-orange-50 border-orange-500'
            }`}>
              <span className="uppercase text-sm tracking-wide font-semibold">
                {netIncome >= 0 ? 'Profit' : 'Loss'}
              </span>
              <span className={`font-bold ${
                netIncome >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>
                {formatCurrency(Math.abs(netIncome))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b">
            <div className="flex items-center justify-between">
              <CardTitle>Top Spending Categories</CardTitle>
              <PieChart className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {topCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No expense categories yet
              </div>
            ) : (
              topCategories.map(([category, amount], index) => (
                <div
                  key={category}
                  className="flex justify-between items-center p-4 rounded-lg bg-slate-50 border-l-4 border-slate-400"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-200 rounded-full w-6 h-6 flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-slate-900">{category}</span>
                  </div>
                  <span className="text-slate-900 font-semibold">{formatCurrency(amount)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
