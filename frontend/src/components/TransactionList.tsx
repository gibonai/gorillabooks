import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search } from "lucide-react";
import { Transaction } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<void>;
}

type FilterType = 'all' | 'income' | 'expense';

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(t => {
      // Filter by type
      if (filterType !== 'all' && t.type !== filterType) {
        return false;
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          (t.vendor && t.vendor.toLowerCase().includes(query))
        );
      }

      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-5 rounded-2xl"></div>
        <div className="relative bg-white border-l-4 border-amber-500 shadow-sm p-6 rounded-xl">
          <h2>Transaction History</h2>
          <p className="text-muted-foreground">All income and expenses in chronological order</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div>
                <h3 className="text-muted-foreground">No transactions yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create your first transaction to get started
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                All Transactions
                <Badge variant="outline">{filteredTransactions.length}</Badge>
              </CardTitle>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filter Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'income' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('income')}
                  className={filterType === 'income' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  Income
                </Button>
                <Button
                  variant={filterType === 'expense' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('expense')}
                  className={filterType === 'expense' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Expenses
                </Button>
              </div>

              {/* Search Input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by description, category, or vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction._id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="whitespace-nowrap">
                          {formatDate(transaction.date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              transaction.type === 'income'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }
                          >
                            {transaction.type === 'income' ? 'Income' : 'Expense'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.description}</div>
                            {transaction.notes && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {transaction.notes}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-slate-100">
                            {transaction.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.vendor ? (
                            <span className="text-sm text-muted-foreground">{transaction.vendor}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-red-50">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this transaction? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(transaction._id)} className="bg-red-600 hover:bg-red-700">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
