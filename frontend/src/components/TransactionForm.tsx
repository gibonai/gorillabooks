import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, DollarSign } from "lucide-react";
import { Transaction, TransactionType, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/types";
import { toast } from "sonner";

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export function TransactionForm({ onSave }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Reset category when type changes if current category is not valid for new type
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newCategories = newType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!newCategories.includes(category)) {
      setCategory('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    if (!description.trim()) {
      toast.error('Please describe what this transaction was for');
      return;
    }

    const transaction: Omit<Transaction, '_id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      type,
      amount: parseFloat(amount),
      category,
      description: description.trim(),
      vendor: vendor.trim() || undefined,
      date,
      notes: notes.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      await onSave(transaction);

      // Show success message
      toast.success('Transaction saved successfully!', {
        icon: <CheckCircle2 className="h-4 w-4" />,
      });

      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setVendor('');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    } catch (error) {
      // Error handling is done in parent component
      toast.error('Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-10 rounded-2xl"></div>
        <div className="relative bg-white border-l-4 border-emerald-500 shadow-sm p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-semibold">Add Transaction</h2>
          </div>
          <p className="text-muted-foreground">Track your business income and expenses</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6 space-y-6">
          {/* Transaction Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Is this money coming in or going out?</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  type === 'income'
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">Money In</div>
                  <div className="text-xs text-muted-foreground mt-1">Income, sales, funding</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-200 bg-white hover:border-red-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold">Money Out</div>
                  <div className="text-xs text-muted-foreground mt-1">Expenses, bills, costs</div>
                </div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-semibold">
              How much?
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="pl-7 text-lg"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-base font-semibold">
              What category?
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="bg-white">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">
              What was this for?
            </Label>
            <Input
              id="description"
              placeholder="e.g., Office rent for January, Client payment for website project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="bg-white"
            />
          </div>

          {/* Vendor/Payee */}
          <div className="space-y-2">
            <Label htmlFor="vendor" className="text-base font-semibold">
              {type === 'income' ? 'Who paid you?' : 'Who did you pay?'} <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="vendor"
              placeholder={type === 'income' ? 'e.g., Acme Corp, John Smith' : 'e.g., Amazon, Verizon, Joe\'s Coffee'}
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-base font-semibold">
              When did this happen?
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="bg-white"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold">
              Any additional notes? <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any extra details you want to remember..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="bg-white resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setAmount('');
            setCategory('');
            setDescription('');
            setVendor('');
            setDate(new Date().toISOString().split('T')[0]);
            setNotes('');
          }}
          disabled={isSubmitting}
        >
          Clear Form
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-8"
        >
          {isSubmitting ? 'Saving...' : 'Save Transaction'}
        </Button>
      </div>
    </form>
  );
}
