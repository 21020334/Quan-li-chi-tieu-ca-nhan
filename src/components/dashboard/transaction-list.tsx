'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Calendar, Search, Filter } from 'lucide-react'

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

interface TransactionListProps {
  transactions: Transaction[]
  loading: boolean
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

export default function TransactionList({ 
  transactions, 
  loading, 
  onEdit, 
  onDelete 
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  const [filterCategory, setFilterCategory] = useState<string>('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get unique categories for filter
  const categories = useMemo(() => {
    const categorySet = new Set()
    transactions.forEach(t => {
      if (t.category) {
        categorySet.add(t.category.id)
      }
    })
    return Array.from(categorySet)
  }, [transactions])

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const descriptionMatch = transaction.description?.toLowerCase().includes(searchLower)
        const categoryMatch = transaction.category?.name.toLowerCase().includes(searchLower)
        if (!descriptionMatch && !categoryMatch) {
          return false
        }
      }

      // Type filter
      if (filterType !== 'ALL' && transaction.type !== filterType) {
        return false
      }

      // Category filter
      if (filterCategory !== 'ALL' && transaction.categoryId !== filterCategory) {
        return false
      }

      // Date range filter
      if (dateFrom) {
        const transactionDate = new Date(transaction.date)
        const fromDate = new Date(dateFrom)
        if (transactionDate < fromDate) {
          return false
        }
      }

      if (dateTo) {
        const transactionDate = new Date(transaction.date)
        const toDate = new Date(dateTo)
        if (transactionDate > toDate) {
          return false
        }
      }

      return true
    })
  }, [transactions, searchTerm, filterType, filterCategory, dateFrom, dateTo])

  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Đang tải...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Lịch sử giao dịch
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Bộ lọc
          </Button>
        </CardTitle>
        
        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm theo mô tả hoặc danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label>Loại giao dịch</Label>
                <Select value={filterType} onValueChange={(value: 'ALL' | 'INCOME' | 'EXPENSE') => setFilterType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="INCOME">Thu nhập</SelectItem>
                    <SelectItem value="EXPENSE">Chi tiêu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    {transactions
                      .filter(t => t.category)
                      .map(t => t.category!)
                      .filter((cat, index, self) => self.findIndex(c => c.id === cat.id) === index)
                      .map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center space-x-2">
                            {category.icon && <span>{category.icon}</span>}
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Từ ngày</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Đến ngày</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Results count */}
          <div className="text-sm text-gray-600">
            Hiển thị {filteredTransactions.length} / {transactions.length} giao dịch
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {transactions.length === 0 ? 'Chưa có giao dịch nào' : 'Không tìm thấy giao dịch phù hợp'}
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {sortedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {transaction.category?.icon && (
                      <span className="text-2xl">{transaction.category.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.description || transaction.category?.name || 'Giao dịch'}
                      </p>
                      {transaction.category && (
                        <Badge 
                          variant="secondary"
                          style={{ 
                            backgroundColor: transaction.category.color + '20',
                            color: transaction.category.color 
                          }}
                        >
                          {transaction.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(transaction.date)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`text-right ${
                    transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <p className="font-semibold">
                      {transaction.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(transaction)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}