import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get user from cookie
    const userCookie = request.cookies.get('user')
    
    if (!userCookie) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập' },
        { status: 401 }
      )
    }

    const user = JSON.parse(userCookie.value)

    // Get budgets for the user
    const budgets = await db.budget.findMany({
      where: { userId: user.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
            icon: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate spent amounts for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await db.transaction.aggregate({
          where: {
            userId: user.id,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: {
              gte: budget.startDate,
              lte: budget.endDate
            }
          },
          _sum: {
            amount: true
          }
        })

        const spentAmount = spent._sum.amount || 0
        const remaining = budget.amount - spentAmount
        const percentage = (spentAmount / budget.amount) * 100
        const isOverBudget = spentAmount > budget.amount
        const isNearLimit = percentage >= (budget.alertThreshold * 100)

        return {
          ...budget,
          spent: spentAmount,
          remaining,
          percentage,
          isOverBudget,
          isNearLimit
        }
      })
    )

    return NextResponse.json({
      budgets: budgetsWithSpent
    })
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tải ngân sách' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from cookie
    const userCookie = request.cookies.get('user')
    
    if (!userCookie) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập' },
        { status: 401 }
      )
    }

    const user = JSON.parse(userCookie.value)
    const body = await request.json()

    const { amount, period, categoryId, alertThreshold } = body

    if (!amount || !period || !categoryId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Calculate start and end dates based on period
    const now = new Date()
    let startDate, endDate

    switch (period) {
      case 'WEEKLY':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0)
        
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6) // End of week (Saturday)
        endDate.setHours(23, 59, 59, 999)
        break

      case 'MONTHLY':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
        break

      case 'YEARLY':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        endDate.setHours(23, 59, 59, 999)
        break

      default:
        return NextResponse.json(
          { error: 'Kỳ hạn ngân sách không hợp lệ' },
          { status: 400 }
        )
    }

    // Check if budget already exists for this category and period
    const existingBudget = await db.budget.findFirst({
      where: {
        userId: user.id,
        categoryId,
        startDate,
        endDate
      }
    })

    if (existingBudget) {
      return NextResponse.json(
        { error: 'Ngân sách cho danh mục này trong kỳ đã tồn tại' },
        { status: 409 }
      )
    }

    // Create budget
    const budget = await db.budget.create({
      data: {
        amount: parseFloat(amount),
        period,
        categoryId,
        startDate,
        endDate,
        alertThreshold: alertThreshold || 0.8,
        userId: user.id
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
            icon: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Tạo ngân sách thành công',
      budget
    })
  } catch (error) {
    console.error('Error creating budget:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo ngân sách' },
      { status: 500 }
    )
  }
}