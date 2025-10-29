import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dashboard } from "./components/Dashboard";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import { Reports } from "./components/Reports";
import { Transaction } from "./types/accounting";
import { LayoutDashboard, FileText, PlusCircle, ListChecks } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";

const STORAGE_KEY = 'accounting-transactions';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Load transactions from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTransactions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, []);

  // Save transactions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }, [transactions]);

  const handleSaveTransaction = (transaction: Transaction) => {
    setTransactions([...transactions, transaction]);
    setActiveTab('transactions');
    toast.success('🦍 Transaction saved successfully!');
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    toast.success('🦍 Transaction deleted successfully!');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-r from-slate-800 to-slate-700 shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-white shadow-lg overflow-hidden border-2 border-white">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1714209434738-b1bce846401d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb3JpbGxhJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYxNzQ5NTMyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="GorillaBooks"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                <span className="text-xs">🍌</span>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-white flex items-center gap-2">
                GorillaBooks
                <span>🦍</span>
              </h1>
              <p className="text-slate-300 text-sm mt-0.5">
                Powerful accounting that doesn't monkey around
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8 h-auto p-1">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 py-3"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="new-transaction" 
              className="flex items-center gap-2 py-3"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="hidden sm:inline">New Entry</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="flex items-center gap-2 py-3"
            >
              <ListChecks className="h-5 w-5" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex items-center gap-2 py-3"
            >
              <FileText className="h-5 w-5" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard transactions={transactions} />
          </TabsContent>

          <TabsContent value="new-transaction">
            <TransactionForm onSave={handleSaveTransaction} />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionList 
              transactions={transactions} 
              onDelete={handleDeleteTransaction}
            />
          </TabsContent>

          <TabsContent value="reports">
            <Reports transactions={transactions} />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster />
    </div>
  );
}
