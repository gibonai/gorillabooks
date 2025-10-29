import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import { Dashboard } from '@/components/Dashboard';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { useTransactions } from '@/hooks/useTransactions';
import { Transaction } from '@/types';
import { useState } from 'react';

// Protected Route wrapper component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Main Dashboard Page with Tabs
function DashboardPage() {
  const { user, logout } = useAuth();
  const { transactions, isLoading, error, createTransaction, deleteTransaction } = useTransactions();
  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);

  const handleSaveTransaction = async (transaction: Omit<Transaction, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createTransaction(transaction);
      toast.success('Transaction saved successfully!');
      setShowNewTransactionForm(false); // Close form after successful save
    } catch (error: any) {
      toast.error(error.message || 'Failed to save transaction');
      throw error;
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast.success('Transaction deleted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete transaction');
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="GorillaBooks Logo"
              className="h-10 w-10 rounded-lg"
            />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              GorillaBooks
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Welcome, {user?.name}
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-lg">Loading transactions...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        ) : (
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard">
              <Dashboard transactions={transactions} />
            </TabsContent>
            <TabsContent value="transactions" className="space-y-6">
              {showNewTransactionForm ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>New Transaction</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewTransactionForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TransactionForm onSave={handleSaveTransaction} />
                  </CardContent>
                </Card>
              ) : (
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowNewTransactionForm(true)}
                    className="gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    New Transaction
                  </Button>
                </div>
              )}
              <TransactionList transactions={transactions} onDelete={handleDeleteTransaction} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
