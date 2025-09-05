'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Download, FileSpreadsheet, FileText, Calendar as CalendarIcon } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

interface ReportExportProps {
  transactions: Transaction[]
}

export default function ReportExport({ transactions }: ReportExportProps) {
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel')
  const [reportType, setReportType] = useState<'summary' | 'detailed'>('summary')
  const [dateRange, setDateRange] = useState<'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'>('thisMonth')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

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

  const getDateRange = () => {
    const now = new Date()
    let from, to

    switch (dateRange) {
      case 'thisMonth':
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'lastMonth':
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        to = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'thisYear':
        from = new Date(now.getFullYear(), 0, 1)
        to = new Date(now.getFullYear(), 11, 31)
        break
      case 'custom':
        from = customDateFrom ? new Date(customDateFrom) : new Date(now.getFullYear(), now.getMonth(), 1)
        to = customDateTo ? new Date(customDateTo) : new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      default:
        from = new Date(now.getFullYear(), now.getMonth(), 1)
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    return { from, to }
  }

  const getFilteredTransactions = () => {
    const { from, to } = getDateRange()
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      return transactionDate >= from && transactionDate <= to
    })
  }

  const generateSummaryReport = () => {
    const filteredTransactions = getFilteredTransactions()
    
    const income = filteredTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const balance = income - expenses

    // Group by category
    const categorySummary = new Map()
    filteredTransactions.forEach(transaction => {
      if (transaction.category) {
        const key = transaction.category.name
        if (!categorySummary.has(key)) {
          categorySummary.set(key, {
            name: transaction.category.name,
            income: 0,
            expenses: 0,
            color: transaction.category.color || '#000000'
          })
        }
        
        const summary = categorySummary.get(key)
        if (transaction.type === 'INCOME') {
          summary.income += transaction.amount
        } else {
          summary.expenses += transaction.amount
        }
      }
    })

    return {
      income,
      expenses,
      balance,
      categorySummary: Array.from(categorySummary.values()),
      transactionCount: filteredTransactions.length,
      dateRange: getDateRange()
    }
  }

  const exportToExcel = async () => {
    setIsExporting(true)
    try {
      const filteredTransactions = getFilteredTransactions()
      const summary = generateSummaryReport()

      if (reportType === 'summary') {
        // Create summary workbook
        const wsSummary = XLSX.utils.json_to_sheet([
          { 'Báo cáo tài chính': 'Tổng quan' },
          { 'Tổng thu nhập': formatCurrency(summary.income) },
          { 'Tổng chi tiêu': formatCurrency(summary.expenses) },
          { 'Số dư': formatCurrency(summary.balance) },
          { 'Số lượng giao dịch': summary.transactionCount },
          {},
          { 'Chi tiết theo danh mục': '' },
          ...summary.categorySummary.map(cat => ({
            'Danh mục': cat.name,
            'Thu nhập': formatCurrency(cat.income),
            'Chi tiêu': formatCurrency(cat.expenses),
            'Số dư': formatCurrency(cat.income - cat.expenses)
          }))
        ])

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng quan')
        
        const fileName = `bao_cao_tai_chinh_${new Date().toISOString().split('T')[0]}.xlsx`
        XLSX.writeFile(wb, fileName)
      } else {
        // Create detailed workbook
        const wsDetailed = XLSX.utils.json_to_sheet([
          { 'ID': 'ID', 'Ngày': 'Ngày', 'Loại': 'Loại', 'Danh mục': 'Danh mục', 'Mô tả': 'Mô tả', 'Số tiền': 'Số tiền' },
          ...filteredTransactions.map(t => ({
            'ID': t.id,
            'Ngày': formatDate(t.date),
            'Loại': t.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu',
            'Danh mục': t.category?.name || '',
            'Mô tả': t.description || '',
            'Số tiền': t.type === 'INCOME' ? t.amount : -t.amount
          }))
        ])

        const wsSummary = XLSX.utils.json_to_sheet([
          { 'Báo cáo tài chính': 'Chi tiết' },
          { 'Tổng thu nhập': formatCurrency(summary.income) },
          { 'Tổng chi tiêu': formatCurrency(summary.expenses) },
          { 'Số dư': formatCurrency(summary.balance) },
          { 'Số lượng giao dịch': summary.transactionCount }
        ])

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng quan')
        XLSX.utils.book_append_sheet(wb, wsDetailed, 'Chi tiết')
        
        const fileName = `bao_cao_chi_tiet_${new Date().toISOString().split('T')[0]}.xlsx`
        XLSX.writeFile(wb, fileName)
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error)
    } finally {
      setIsExporting(false)
      setIsDialogOpen(false)
    }
  }

  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      const summary = generateSummaryReport()
      
      // Create HTML content for PDF
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="text-align: center; color: #333;">Báo cáo tài chính</h1>
          <p style="text-align: center; color: #666;">
            Từ ${formatDate(summary.dateRange.from.toISOString())} đến ${formatDate(summary.dateRange.to.toISOString())}
          </p>
          
          <div style="margin: 30px 0;">
            <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 5px;">Tổng quan</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tổng thu nhập:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #10B981;">${formatCurrency(summary.income)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tổng chi tiêu:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #EF4444;">${formatCurrency(summary.expenses)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Số dư:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: ${summary.balance >= 0 ? '#10B981' : '#EF4444'};">${formatCurrency(summary.balance)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Số lượng giao dịch:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${summary.transactionCount}</td>
              </tr>
            </table>
          </div>
          
          ${reportType === 'detailed' ? `
          <div style="margin: 30px 0;">
            <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 5px;">Chi tiết giao dịch</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Ngày</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Loại</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Danh mục</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Mô tả</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                ${getFilteredTransactions().map(t => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${formatDate(t.date)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${t.type === 'INCOME' ? 'Thu nhập' : 'Chi tiêu'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${t.category?.name || ''}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${t.description || ''}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: ${t.type === 'INCOME' ? '#10B981' : '#EF4444'};">
                      ${t.type === 'INCOME' ? '+' : '-'}${formatCurrency(t.amount)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          
          <div style="margin: 30px 0;">
            <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 5px;">Theo danh mục</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Danh mục</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Thu nhập</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Chi tiêu</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Số dư</th>
                </tr>
              </thead>
              <tbody>
                ${summary.categorySummary.map(cat => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${cat.name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #10B981;">${formatCurrency(cat.income)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #EF4444;">${formatCurrency(cat.expenses)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: ${cat.income - cat.expenses >= 0 ? '#10B981' : '#EF4444'};">${formatCurrency(cat.income - cat.expenses)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `

      // Create a temporary div to render HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      document.body.appendChild(tempDiv)

      // Convert to canvas and then to PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Clean up
      document.body.removeChild(tempDiv)

      const fileName = `bao_cao_tai_chinh_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error('Error exporting to PDF:', error)
    } finally {
      setIsExporting(false)
      setIsDialogOpen(false)
    }
  }

  const handleExport = async () => {
    if (exportType === 'excel') {
      await exportToExcel()
    } else {
      await exportToPDF()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Xuất báo cáo</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Xuất báo cáo tài chính</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Định dạng</Label>
                  <Select value={exportType} onValueChange={(value: 'excel' | 'pdf') => setExportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">
                        <div className="flex items-center space-x-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>Excel</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="pdf">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>PDF</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Loại báo cáo</Label>
                  <Select value={reportType} onValueChange={(value: 'summary' | 'detailed') => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Tổng quan</SelectItem>
                      <SelectItem value="detailed">Chi tiết</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kỳ báo cáo</Label>
                <Select value={dateRange} onValueChange={(value: 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom') => setDateRange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisMonth">Tháng này</SelectItem>
                    <SelectItem value="lastMonth">Tháng trước</SelectItem>
                    <SelectItem value="thisYear">Năm nay</SelectItem>
                    <SelectItem value="custom">Tùy chỉnh</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Từ ngày</Label>
                    <Input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Đến ngày</Label>
                    <Input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={handleExport} 
                  disabled={isExporting}
                  className="flex-1"
                >
                  {isExporting ? 'Đang xuất...' : 'Xuất báo cáo'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}