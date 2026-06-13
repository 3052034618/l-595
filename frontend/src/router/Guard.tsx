import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useUserStore } from '@/store/userStore'
import { isAuthenticated } from '@/utils/auth'

interface AuthGuardProps {
  children: React.ReactNode
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const location = useLocation()
  const { isAuthenticated: storeAuthenticated, loading, fetchCurrentUser, token } = useUserStore()

  useEffect(() => {
    if (token && !storeAuthenticated) {
      fetchCurrentUser()
    }
  }, [token, storeAuthenticated, fetchCurrentUser])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!isAuthenticated() || !storeAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export const GuestGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const location = useLocation()
  const { isAuthenticated: storeAuthenticated } = useUserStore()

  if (isAuthenticated() && storeAuthenticated) {
    const from = (location.state as { from?: Location })?.from?.pathname || '/'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}

export default AuthGuard
