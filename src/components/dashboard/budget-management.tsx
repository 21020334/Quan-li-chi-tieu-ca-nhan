'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, AlertTriangle, Target } from 'lucide-react'

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  color?: string
  icon?: string
}

interface Budget {
  id: string
  amount: number
  period: 'MONTHLY' | 'YEARLY' | 'WEEKLY'
  startDate: string
  endDate: string
  alertThreshold: number
  spent: number
  remaining: number
  percentage: number
  isOverBudget: boolean
  isNearLimit: boolean
  category: {
    id: string
    name: string
    type: 'INCOME' | 'EXPENSE'
    color?: string
    icon?: string
  }
}

interface BudgetManagementProps {
  onBudgetAlert?: (budget: Budget) => void
}

export default function BudgetManagement({ onBudgetAlert }: BudgetManagementProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  useEffect(() => {
    fetchBudgets()
    fetchCategories()
  }, [])

  useEffect(() => {
    // Check for budget alerts
    const alertBudgets = budgets.filter(b => b.isOverBudget || b.isNearLimit)
    alertBudgets.forEach(budget => {
      if (onBudgetAlert) {
        onBudgetAlert(budget)
      }
    })
  }, [budgets, onBudgetAlert])

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budgets')
      if (response.ok) {
        const data = await response.json()
        setBudgets(data.budgets)
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        // Only show expense categories for budgets
        setCategories(data.categories.filter((cat: Category) => cat.type === 'EXPENSE'))
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleBudgetSubmit = async (budgetData: any) => {
    try {
      const url = editingBudget 
        ? `/api/budgets/${editingBudget.id}`
        : '/api/budgets'
      
      const method = editingBudget ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(budgetData),
      })

      if (response.ok) {
        await fetchBudgets()
        setShowBudgetForm(false)
        setEditingBudget(null)
      }
    } catch (error) {
      console.error('Error saving budget:', error)
    }
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setShowBudgetForm(true)
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ngân sách này?')) return

    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchBudgets()
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

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

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'WEEKLY': return 'Hàng tuần'
      case 'MONTHLY': return 'Hàng tháng'
      case 'YEARLY': return 'Hàng năm'
      default: return period
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quản lý ngân sách</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Đang tải...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quản lý ngân sách</h2>
          <p className="text-gray-600">Đặt giới hạn chi tiêu và nhận cảnh báo</p>
        </div>
        <Button 
          onClick={() => {
            setEditingBudget(null)
            setShowBudgetForm(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm ngân sách
        </Button>
      </div>

      {/* Budget Form Modal */}
      {showBudgetForm && (
        <BudgetForm
          onSubmit={handleBudgetSubmit}
          onCancel={() => {
            setShowBudgetForm(false)
            setEditingBudget(null)
          }}
          initialData={editingBudget}
          categories={categories}
        />
      )}

      {/* Budget Alerts */}
      {budgets.some(b => b.isOverBudget || b.isNearLimit) && (
        <div className="space-y-2">
          {budgets.filter(b => b.isOverBudget).map(budget => (
            <Alert key={budget.id} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Vượt ngân sách!</strong> {budget.category.name} đã chi {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
              </AlertDescription>
            </Alert>
          ))}
          {budgets.filter(b => b.isNearLimit && !b.isOverBudget).map(budget => (
            <Alert key={budget.id}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Gần hết ngân sách!</strong> {budget.category.name} đã chi {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Budgets List */}
      {budgets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có ngân sách nào</h3>
            <p className="text-gray-600 mb-4">Tạo ngân sách đầu tiên để kiểm soát chi tiêu của bạn</p>
            <Button 
              onClick={() => {
                setEditingBudget(null)
                setShowBudgetForm(true)
              }}
            >
              Tạo ngân sách
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <Card key={budget.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {budget.category.icon && (
                      <span className="text-xl">{budget.category.icon}</span>
                    )}
                    <CardTitle className="text-lg">{budget.category.name}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditBudget(budget)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{getPeriodText(budget.period)}</Badge>
                  {budget.isOverBudget && (
                    <Badge variant="destructive">Vượt ngân sách</Badge>
                  )}
                  {budget.isNearLimit && !budget.isOverBudget && (
                    <Badge variant="secondary">Gần hết</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{formatCurrency(budget.spent)}</span>
                    <span>{formatCurrency(budget.amount)}</span>
                  </div>
                  <Progress 
                    value={Math.min(budget.percentage, 100)} 
                    className={`h-2 ${budget.isOverBudget ? '[&>div]:bg-red-500' : budget.isNearLimit ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{budget.percentage.toFixed(1)}% đã sử dụng</span>
                    <span>Còn lại: {formatCurrency(budget.remaining)}</span>
                  </div>
                </div>

                {/* Date Range */}
                <div className="text-xs text-gray-500">
                  <div>Từ: {formatDate(budget.startDate)}</div>
                  <div>Đến: {formatDate(budget.endDate)}</div>
                </div>

                {/* Alert Threshold */}
                <div className="text-xs text-gray-500">
                  Cảnh báo khi đạt {(budget.alertThreshold * 100).toFixed(0)}%
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

interface BudgetFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  initialData?: Budget | null
  categories: Category[]
}

function BudgetForm({ onSubmit, onCancel, initialData, categories }: BudgetFormProps) {
  const [formData, setFormData] = useState({
    amount: '',
    period: 'MONTHLY' as 'MONTHLY' | 'YEARLY' | 'WEEKLY',
    categoryId: '',
    alertThreshold: '0.8'
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount.toString(),
        period: initialData.period,
        categoryId: initialData.category.id,
        alertThreshold: initialData.alertThreshold.toString()
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      amount: parseFloat(formData.amount),
      period: formData.period,
      categoryId: formData.categoryId,
      alertThreshold: parseFloat(formData.alertThreshold)
    })
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Chỉnh sửa ngân sách' : 'Thêm ngân sách mới'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Danh mục</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center space-x-2">
                      {category.icon && <span>{category.icon}</span>}
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền ngân sách</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Kỳ hạn</Label>
            <Select
              value={formData.period}
              onValueChange={(value: 'MONTHLY' | 'YEARLY' | 'WEEKLY') => 
                setFormData({ ...formData, period: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WEEKLY">Hàng tuần</SelectItem>
                <SelectItem value="MONTHLY">Hàng tháng</SelectItem>
                <SelectItem value="YEARLY">Hàng năm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alertThreshold">Ngưỡng cảnh báo (%)</Label>
            <Select
              value={formData.alertThreshold}
              onValueChange={(value) => setFormData({ ...formData, alertThreshold: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">50%</SelectItem>
                <SelectItem value="0.7">70%</SelectItem>
                <SelectItem value="0.8">80%</SelectItem>
                <SelectItem value="0.9">90%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" className="flex-1">
              {initialData ? 'Cập nhật' : 'Thêm'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}