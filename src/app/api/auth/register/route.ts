import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, mật khẩu và tên là bắt buộc' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    // Create default categories for the user
    const defaultCategories = [
      { name: 'Lương', type: 'INCOME', color: '#10B981', icon: '💰' },
      { name: 'Thu nhập khác', type: 'INCOME', color: '#3B82F6', icon: '💵' },
      { name: 'Ăn uống', type: 'EXPENSE', color: '#EF4444', icon: '🍔' },
      { name: 'Đi lại', type: 'EXPENSE', color: '#F59E0B', icon: '🚗' },
      { name: 'Học tập', type: 'EXPENSE', color: '#8B5CF6', icon: '📚' },
      { name: 'Giải trí', type: 'EXPENSE', color: '#EC4899', icon: '🎮' },
      { name: 'Mua sắm', type: 'EXPENSE', color: '#06B6D4', icon: '🛍️' },
      { name: 'Sức khỏe', type: 'EXPENSE', color: '#84CC16', icon: '🏥' },
      { name: 'Hóa đơn', type: 'EXPENSE', color: '#F97316', icon: '📄' },
      { name: 'Khác', type: 'EXPENSE', color: '#6B7280', icon: '📦' }
    ]

    await db.category.createMany({
      data: defaultCategories.map(category => ({
        ...category,
        userId: user.id
      }))
    })

    // Create response with user data (excluding password)
    const { password: _, ...userWithoutPassword } = user

    // Create response with user info
    const response = NextResponse.json({
      message: 'Đăng ký thành công',
      user: userWithoutPassword
    })

    // Set user info in cookies for client-side access
    response.cookies.set('user', JSON.stringify(userWithoutPassword), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đăng ký' },
      { status: 500 }
    )
  }
}