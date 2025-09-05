'use client'

import { useState, useEffect } from 'react'
import AuthForm from '@/components/auth/auth-form'
import Dashboard from '@/components/dashboard/dashboard'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  name?: string
  createdAt: string
  updatedAt: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is logged in on component mount
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)
        }
      } catch (error) {
        console.error('Auth check error:', error)
      }
    }
    checkAuth()
  }, [])

  const handleLogin = async (email: string, password: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn quay trở lại!",
        })
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Đã xảy ra lỗi khi đăng nhập')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (email: string, password: string, name: string) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        toast({
          title: "Đăng ký thành công",
          description: "Tài khoản của bạn đã được tạo thành công!",
        })
      } else {
        setError(data.error)
      }
    } catch (error) {
      setError('Đã xảy ra lỗi khi đăng ký')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      setUser(null)
      toast({
        title: "Đăng xuất thành công",
        description: "Hẹn gặp lại bạn!",
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />
  }

  return (
    <AuthForm
      onLogin={handleLogin}
      onRegister={handleRegister}
      error={error}
      loading={loading}
    />
  )
}