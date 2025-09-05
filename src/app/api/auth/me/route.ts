import { NextRequest, NextResponse } from 'next/server'

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

    // Parse user data from cookie
    const user = JSON.parse(userCookie.value)

    return NextResponse.json({
      user
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xác thực người dùng' },
      { status: 500 }
    )
  }
}