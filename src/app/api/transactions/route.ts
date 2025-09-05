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

    // Get transactions for the user
    const transactions = await db.transaction.findMany({
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
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({
      transactions
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tải giao dịch' },
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

    const { amount, description, type, categoryId, date } = body

    if (!amount || !type || !date) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        amount: parseFloat(amount),
        description,
        type,
        categoryId,
        date: new Date(date),
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
      message: 'Tạo giao dịch thành công',
      transaction
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo giao dịch' },
      { status: 500 }
    )
  }
}