import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { Transaction } from "../types/accounting";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

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

  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-5 rounded-2xl"></div>
        <div className="relative bg-white border-l-4 border-amber-500 shadow-sm p-6 rounded-xl">
          <h2 className="flex items-center gap-2">
            Transaction History
            <span className="text-2xl">📚</span>
          </h2>
          <p className="text-muted-foreground">All journal entries in chronological order</p>
        </div>
      </div>

      {sortedTransactions.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <div className="text-7xl">🦍</div>
              <div>
                <h3 className="text-muted-foreground">No transactions yet</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create your first journal entry to get started
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="flex items-center gap-2">
              All Transactions
              <Badge variant="outline">{sortedTransactions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debits</TableHead>
                    <TableHead className="text-right">Credits</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTransactions.map((transaction) => {
                    const isExpanded = expandedRows.has(transaction.id);
                    const totalDebits = transaction.entries
                      .filter(e => e.type === 'debit')
                      .reduce((sum, e) => sum + e.amount, 0);
                    const totalCredits = transaction.entries
                      .filter(e => e.type === 'credit')
                      .reduce((sum, e) => sum + e.amount, 0);

                    return (
                      <>
                        <TableRow key={transaction.id} className="cursor-pointer hover:bg-slate-50/50 transition-colors">
                          <TableCell onClick={() => toggleRow(transaction.id)} className="text-center">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell onClick={() => toggleRow(transaction.id)} className="whitespace-nowrap">
                            {formatDate(transaction.date)}
                          </TableCell>
                          <TableCell onClick={() => toggleRow(transaction.id)}>
                            {transaction.description}
                          </TableCell>
                          <TableCell className="text-right text-blue-700" onClick={() => toggleRow(transaction.id)}>
                            {formatCurrency(totalDebits)}
                          </TableCell>
                          <TableCell className="text-right text-purple-700" onClick={() => toggleRow(transaction.id)}>
                            {formatCurrency(totalCredits)}
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
                                  <AlertDialogAction onClick={() => onDelete(transaction.id)} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-slate-50/50 p-0">
                              <div className="p-6 space-y-3">
                                {transaction.entries.map((entry) => (
                                  <div key={entry.id} className="grid gap-4 md:grid-cols-2 p-5 bg-white rounded-lg border shadow-sm">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <Badge 
                                          variant={entry.type === 'debit' ? 'default' : 'secondary'}
                                          className={entry.type === 'debit' ? 'bg-blue-600' : 'bg-purple-600'}
                                        >
                                          {entry.type.toUpperCase()}
                                        </Badge>
                                        <span>{formatCurrency(entry.amount)}</span>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">GAAP Classification</p>
                                        <p className="text-sm">{entry.gaapCategory} → {entry.gaapSubcategory}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      {entry.vendor && (
                                        <div>
                                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Vendor</p>
                                          <p className="text-sm">{entry.vendor}</p>
                                        </div>
                                      )}
                                      {entry.tags && entry.tags.length > 0 && (
                                        <div>
                                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tags</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {entry.tags.map((tag, i) => (
                                              <Badge key={i} variant="outline" className="text-xs">
                                                {tag}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {entry.notes && (
                                        <div>
                                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                                          <p className="text-sm text-muted-foreground">{entry.notes}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
