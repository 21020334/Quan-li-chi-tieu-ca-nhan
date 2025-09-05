'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts'

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

interface ChartsProps {
  transactions: Transaction[]
}

export default function Charts({ transactions }: ChartsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  // Calculate category data for pie chart
  const getCategoryData = () => {
    const categoryMap = new Map()
    
    transactions
      .filter(t => t.type === 'EXPENSE' && t.category)
      .forEach(transaction => {
        const categoryName = transaction.category!.name
        const color = transaction.category!.color || '#6B7280'
        
        if (categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            name: categoryName,
            value: categoryMap.get(categoryName).value + transaction.amount,
            color: color
          })
        } else {
          categoryMap.set(categoryName, {
            name: categoryName,
            value: transaction.amount,
            color: color
          })
        }
      })

    return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value)
  }

  // Calculate monthly data for bar chart
  const getMonthlyData = () => {
    const monthlyMap = new Map()
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          income: 0,
          expenses: 0
        })
      }
      
      const monthData = monthlyMap.get(monthKey)
      if (transaction.type === 'INCOME') {
        monthData.income += transaction.amount
      } else {
        monthData.expenses += transaction.amount
      }
    })

    return Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(data => ({
        ...data,
        month: new Date(data.month + '-01').toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })
      }))
  }

  // Calculate daily trend for line chart
  const getDailyTrend = () => {
    const dailyMap = new Map()
    const last30Days = []
    
    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      last30Days.push(dateKey)
      dailyMap.set(dateKey, {
        date: dateKey,
        income: 0,
        expenses: 0,
        balance: 0
      })
    }
    
    transactions.forEach(transaction => {
      const dateKey = transaction.date.split('T')[0]
      if (dailyMap.has(dateKey)) {
        const dayData = dailyMap.get(dateKey)
        if (transaction.type === 'INCOME') {
          dayData.income += transaction.amount
        } else {
          dayData.expenses += transaction.amount
        }
      }
    })

    return Array.from(dailyMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(data => ({
        ...data,
        date: new Date(data.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }),
        balance: data.income - data.expenses
      }))
  }

  const categoryData = getCategoryData()
  const monthlyData = getMonthlyData()
  const dailyTrend = getDailyTrend()

  return (
    <div className="space-y-6">
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="categories">Theo danh mục</TabsTrigger>
          <TabsTrigger value="monthly">Theo tháng</TabsTrigger>
          <TabsTrigger value="trend">Xu hướng</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiêu theo danh mục</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có dữ liệu để hiển thị
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Thu nhập và chi tiêu theo tháng</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có dữ liệu để hiển thị
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip 
                        formatter={(value) => formatCurrency(Number(value))}
                        labelFormatter={(label) => `Tháng: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="#10B981" name="Thu nhập" />
                      <Bar dataKey="expenses" fill="#EF4444" name="Chi tiêu" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Xu hướng số dư 30 ngày gần nhất</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyTrend.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Chưa có dữ liệu để hiển thị
                </div>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip 
                        formatter={(value) => formatCurrency(Number(value))}
                        labelFormatter={(label) => `Ngày: ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Số dư"
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}