import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { AccountingEntry, GAAPCategory, GAAP_ACCOUNTS, Transaction } from "../types/accounting";
import { Badge } from "./ui/badge";

interface TransactionFormProps {
  onSave: (transaction: Transaction) => void;
}

interface EntryFormData {
  id: string;
  type: 'debit' | 'credit';
  gaapCategory: GAAPCategory | '';
  gaapSubcategory: string;
  amount: string;
  vendor: string;
  tags: string;
  notes: string;
}

export function TransactionForm({ onSave }: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<EntryFormData[]>([
    {
      id: crypto.randomUUID(),
      type: 'debit',
      gaapCategory: '',
      gaapSubcategory: '',
      amount: '',
      vendor: '',
      tags: '',
      notes: ''
    }
  ]);

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        id: crypto.randomUUID(),
        type: 'credit',
        gaapCategory: '',
        gaapSubcategory: '',
        amount: '',
        vendor: '',
        tags: '',
        notes: ''
      }
    ]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof EntryFormData, value: string) => {
    setEntries(entries.map(e => {
      if (e.id === id) {
        const updated = { ...e, [field]: value };
        // Reset subcategory if category changes
        if (field === 'gaapCategory') {
          updated.gaapSubcategory = '';
        }
        return updated;
      }
      return e;
    }));
  };

  const calculateTotals = () => {
    const totals = entries.reduce(
      (acc, entry) => {
        const amount = parseFloat(entry.amount) || 0;
        if (entry.type === 'debit') {
          acc.debits += amount;
        } else {
          acc.credits += amount;
        }
        return acc;
      },
      { debits: 0, credits: 0 }
    );
    return totals;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totals = calculateTotals();
    if (Math.abs(totals.debits - totals.credits) > 0.01) {
      alert('Debits and credits must be equal!');
      return;
    }

    if (!description.trim()) {
      alert('Please enter a description');
      return;
    }

    const validEntries = entries.filter(e => e.gaapCategory && e.amount && parseFloat(e.amount) > 0);
    
    if (validEntries.length === 0) {
      alert('Please add at least one valid entry');
      return;
    }

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      date,
      description,
      entries: validEntries.map(e => ({
        id: crypto.randomUUID(),
        type: e.type,
        gaapCategory: e.gaapCategory as GAAPCategory,
        gaapSubcategory: e.gaapSubcategory,
        amount: parseFloat(e.amount),
        vendor: e.vendor || undefined,
        tags: e.tags ? e.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        notes: e.notes || undefined
      })),
      createdAt: new Date().toISOString()
    };

    onSave(transaction);

    // Reset form
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setEntries([
      {
        id: crypto.randomUUID(),
        type: 'debit',
        gaapCategory: '',
        gaapSubcategory: '',
        amount: '',
        vendor: '',
        tags: '',
        notes: ''
      }
    ]);
  };

  const totals = calculateTotals();
  const isBalanced = Math.abs(totals.debits - totals.credits) < 0.01;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-5 rounded-2xl"></div>
        <div className="relative bg-white border-l-4 border-purple-500 shadow-sm p-6 rounded-xl">
          <h2 className="flex items-center gap-2">
            New Journal Entry
            <span className="text-2xl">📝</span>
          </h2>
          <p className="text-muted-foreground">Create a GAAP-compliant accounting entry</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Transaction Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Monthly API expenses"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2">
            Journal Entries
            <Badge variant="outline" className="ml-2">{entries.length}</Badge>
          </h3>
          <Button type="button" onClick={addEntry} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>

        {entries.map((entry, index) => (
          <Card key={entry.id} className="border-l-4 border-l-amber-400 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Entry #{index + 1}</CardTitle>
                {entries.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEntry(entry.id)}
                    className="hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Entry Type</Label>
                  <Select
                    value={entry.type}
                    onValueChange={(value) => updateEntry(entry.id, 'type', value)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Debit</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={entry.amount}
                    onChange={(e) => updateEntry(entry.id, 'amount', e.target.value)}
                    required
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>GAAP Category</Label>
                  <Select
                    value={entry.gaapCategory}
                    onValueChange={(value) => updateEntry(entry.id, 'gaapCategory', value)}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Assets">Assets</SelectItem>
                      <SelectItem value="Liabilities">Liabilities</SelectItem>
                      <SelectItem value="Equity">Equity</SelectItem>
                      <SelectItem value="Revenue">Revenue</SelectItem>
                      <SelectItem value="Expenses">Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select
                    value={entry.gaapSubcategory}
                    onValueChange={(value) => updateEntry(entry.id, 'gaapSubcategory', value)}
                    disabled={!entry.gaapCategory}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {entry.gaapCategory && GAAP_ACCOUNTS[entry.gaapCategory as GAAPCategory].map(account => (
                        <SelectItem key={account} value={account}>
                          {account}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Vendor (Optional)</Label>
                  <Input
                    placeholder="e.g., Anthropic"
                    value={entry.vendor}
                    onChange={(e) => updateEntry(entry.id, 'vendor', e.target.value)}
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags (Optional)</Label>
                  <Input
                    placeholder="e.g., API costs, monthly"
                    value={entry.tags}
                    onChange={(e) => updateEntry(entry.id, 'tags', e.target.value)}
                    className="bg-white"
                  />
                  <p className="text-xs text-muted-foreground">Separate tags with commas</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={entry.notes}
                  onChange={(e) => updateEntry(entry.id, 'notes', e.target.value)}
                  rows={2}
                  className="bg-white"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className={`shadow-md ${isBalanced ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center gap-4 flex-wrap mb-4">
            <div className="flex-1 min-w-[200px] p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs uppercase tracking-wide text-blue-700 mb-1">Total Debits</p>
              <p className="text-2xl text-blue-900">${totals.debits.toFixed(2)}</p>
            </div>
            <div className="flex-1 min-w-[200px] p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs uppercase tracking-wide text-purple-700 mb-1">Total Credits</p>
              <p className="text-2xl text-purple-900">${totals.credits.toFixed(2)}</p>
            </div>
            <div className={`flex-1 min-w-[200px] p-4 rounded-lg border ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs uppercase tracking-wide mb-1 ${isBalanced ? 'text-green-700' : 'text-red-700'}`}>
                Difference
              </p>
              <p className={`text-2xl ${isBalanced ? 'text-green-900' : 'text-red-900'}`}>
                ${Math.abs(totals.debits - totals.credits).toFixed(2)}
              </p>
            </div>
          </div>
          {!isBalanced && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">
                Debits and credits must be equal for a valid journal entry
              </p>
            </div>
          )}
          {isBalanced && totals.debits > 0 && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800">
                Perfect! Your books are balanced 🦍
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button 
          type="submit" 
          disabled={!isBalanced}
          className="px-8 gap-2"
        >
          Save Transaction
          <span>🦍</span>
        </Button>
      </div>
    </form>
  );
}
