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

    // Get categories for the user
    const categories = await db.category.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      categories
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tải danh mục' },
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

    const { name, type, color, icon, description } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Create category
    const category = await db.category.create({
      data: {
        name,
        type,
        color,
        icon,
        description,
        userId: user.id
      }
    })

    return NextResponse.json({
      message: 'Tạo danh mục thành công',
      category
    })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo danh mục' },
      { status: 500 }
    )
  }
}