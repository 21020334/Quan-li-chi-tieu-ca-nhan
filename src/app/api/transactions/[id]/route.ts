import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if transaction exists and belongs to user
    const existingTransaction = await db.transaction.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Giao dịch không tồn tại hoặc không thuộc về bạn' },
        { status: 404 }
      )
    }

    // Update transaction
    const transaction = await db.transaction.update({
      where: { id: params.id },
      data: {
        amount: parseFloat(amount),
        description,
        type,
        categoryId,
        date: new Date(date)
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
      message: 'Cập nhật giao dịch thành công',
      transaction
    })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật giao dịch' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if transaction exists and belongs to user
    const existingTransaction = await db.transaction.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Giao dịch không tồn tại hoặc không thuộc về bạn' },
        { status: 404 }
      )
    }

    // Delete transaction
    await db.transaction.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Xóa giao dịch thành công'
    })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa giao dịch' },
      { status: 500 }
    )
  }
}