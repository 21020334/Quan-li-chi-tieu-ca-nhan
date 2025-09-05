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

    const { amount, alertThreshold } = body

    // Check if budget exists and belongs to user
    const existingBudget = await db.budget.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Ngân sách không tồn tại hoặc không thuộc về bạn' },
        { status: 404 }
      )
    }

    // Update budget
    const budget = await db.budget.update({
      where: { id: params.id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        alertThreshold: alertThreshold !== undefined ? alertThreshold : undefined
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
      message: 'Cập nhật ngân sách thành công',
      budget
    })
  } catch (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật ngân sách' },
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

    // Check if budget exists and belongs to user
    const existingBudget = await db.budget.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    })

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Ngân sách không tồn tại hoặc không thuộc về bạn' },
        { status: 404 }
      )
    }

    // Delete budget
    await db.budget.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Xóa ngân sách thành công'
    })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa ngân sách' },
      { status: 500 }
    )
  }
}