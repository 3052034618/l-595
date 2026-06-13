import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { AuthGuard, GuestGuard } from './Guard'
import MainLayout from '@/layouts/MainLayout'

const Loading: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <Spin size="large" tip="加载中..." />
  </div>
)

const Login = lazy(() => import('@/pages/Login'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const AuditObjects = lazy(() => import('@/pages/AuditObjects'))
const RiskAssessment = lazy(() => import('@/pages/RiskAssessment'))
const AuditPlans = lazy(() => import('@/pages/AuditPlans'))
const Evidences = lazy(() => import('@/pages/Evidences'))
const Findings = lazy(() => import('@/pages/Findings'))
const Rectifications = lazy(() => import('@/pages/Rectifications'))
const Reports = lazy(() => import('@/pages/Reports'))
const SystemLogs = lazy(() => import('@/pages/SystemLogs'))
const Notifications = lazy(() => import('@/pages/Notifications'))

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <GuestGuard>
        <Suspense fallback={<Loading />}>
          <Login />
        </Suspense>
      </GuestGuard>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<Loading />}>
            <Dashboard />
          </Suspense>
        ),
      },
      {
        path: 'audit-objects',
        element: (
          <Suspense fallback={<Loading />}>
            <AuditObjects />
          </Suspense>
        ),
      },
      {
        path: 'risk-assessment',
        element: (
          <Suspense fallback={<Loading />}>
            <RiskAssessment />
          </Suspense>
        ),
      },
      {
        path: 'audit-plans',
        element: (
          <Suspense fallback={<Loading />}>
            <AuditPlans />
          </Suspense>
        ),
      },
      {
        path: 'evidences',
        element: (
          <Suspense fallback={<Loading />}>
            <Evidences />
          </Suspense>
        ),
      },
      {
        path: 'findings',
        element: (
          <Suspense fallback={<Loading />}>
            <Findings />
          </Suspense>
        ),
      },
      {
        path: 'rectifications',
        element: (
          <Suspense fallback={<Loading />}>
            <Rectifications />
          </Suspense>
        ),
      },
      {
        path: 'reports',
        element: (
          <Suspense fallback={<Loading />}>
            <Reports />
          </Suspense>
        ),
      },
      {
        path: 'system-logs',
        element: (
          <Suspense fallback={<Loading />}>
            <SystemLogs />
          </Suspense>
        ),
      },
      {
        path: 'notifications',
        element: (
          <Suspense fallback={<Loading />}>
            <Notifications />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/*',
    element: <Navigate to="/" replace />,
  },
])

export default router
