'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import TransactionList from './transaction-list'
import TransactionForm from './transaction-form'
import StatsCards from './stats-cards'
import Charts from './charts'
import BudgetManagement from './budget-management'
import ReportExport from './report-export'

interface User {
  id: string
  email: string
  name?: string
  createdAt: string
  updatedAt: string
}

interface DashboardProps {
  user: User
  onLogout: () => void
}

interface Transaction {
  id: string
  amount: number
  description?: string
  date: string
  type: 'INCOME' | 'EXPENSE'
  category?: {
    id: string
    name: string
    type: 'INCOME' | 'EXPENSE'
    color?: string
    icon?: string
  }
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTransactionSubmit = async (transactionData: any) => {
    try {
      const url = editingTransaction 
        ? `/api/transactions/${editingTransaction.id}`
        : '/api/transactions'
      
      const method = editingTransaction ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      })

      if (response.ok) {
        await fetchTransactions()
        setShowTransactionForm(false)
        setEditingTransaction(null)
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
    }
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowTransactionForm(true)
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTransactions()
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const calculateBalance = () => {
    return transactions.reduce((balance, transaction) => {
      return transaction.type === 'INCOME' 
        ? balance + transaction.amount 
        : balance - transaction.amount
    }, 0)
  }

  const calculateIncome = () => {
    return transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const calculateExpenses = () => {
    return transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const balance = calculateBalance()
  const income = calculateIncome()
  const expenses = calculateExpenses()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Quản lý tài chính cá nhân
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.name?.[0] || user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <StatsCards balance={balance} income={income} expenses={expenses} />

        {/* Action Button */}
        <div className="mb-6">
          <Button 
            onClick={() => {
              setEditingTransaction(null)
              setShowTransactionForm(true)
            }}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm giao dịch
          </Button>
        </div>

        {/* Transaction Form Modal */}
        {showTransactionForm && (
          <TransactionForm
            onSubmit={handleTransactionSubmit}
            onCancel={() => {
              setShowTransactionForm(false)
              setEditingTransaction(null)
            }}
            initialData={editingTransaction}
          />
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">Giao dịch</TabsTrigger>
            <TabsTrigger value="analytics">Thống kê</TabsTrigger>
            <TabsTrigger value="budgets">Ngân sách</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <TransactionList
              transactions={transactions}
              loading={loading}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <Charts transactions={transactions} />
              <ReportExport transactions={transactions} />
            </div>
          </TabsContent>

          <TabsContent value="budgets">
            <BudgetManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}