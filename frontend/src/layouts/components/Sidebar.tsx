import { useMemo } from 'react'
import { Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  ApartmentOutlined,
  AlertOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  SearchOutlined,
  ToolOutlined,
  BarChartOutlined,
  HistoryOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import type { MenuProps } from 'antd'

type MenuItem = Required<MenuProps>['items'][number]

const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { collapsed } = useAppStore()

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: '仪表盘',
        onClick: () => navigate('/dashboard'),
      },
      {
        key: '/audit-objects',
        icon: <ApartmentOutlined />,
        label: '审计对象管理',
        onClick: () => navigate('/audit-objects'),
      },
      {
        key: '/risk-assessment',
        icon: <AlertOutlined />,
        label: '风险评估',
        onClick: () => navigate('/risk-assessment'),
      },
      {
        key: '/audit-plans',
        icon: <FileTextOutlined />,
        label: '审计计划',
        onClick: () => navigate('/audit-plans'),
      },
      {
        key: '/evidences',
        icon: <PaperClipOutlined />,
        label: '证据管理',
        onClick: () => navigate('/evidences'),
      },
      {
        key: '/findings',
        icon: <SearchOutlined />,
        label: '审计发现',
        onClick: () => navigate('/findings'),
      },
      {
        key: '/rectifications',
        icon: <ToolOutlined />,
        label: '整改跟踪',
        onClick: () => navigate('/rectifications'),
      },
      {
        key: '/reports',
        icon: <BarChartOutlined />,
        label: '报告中心',
        onClick: () => navigate('/reports'),
      },
      {
        key: '/system-logs',
        icon: <HistoryOutlined />,
        label: '系统日志',
        onClick: () => navigate('/system-logs'),
      },
      {
        key: '/notifications',
        icon: <BellOutlined />,
        label: '通知中心',
        onClick: () => navigate('/notifications'),
      },
    ],
    [navigate]
  )

  const selectedKeys = useMemo(() => {
    const pathname = location.pathname
    return [pathname]
  }, [location.pathname])

  return (
    <div className="h-full flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-gray-100">
        <h1 className="text-lg font-bold text-white truncate px-4">
          {collapsed ? '审计' : '内部审计管理系统'}
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <Menu
          mode="inline"
          theme="dark"
          items={menuItems}
          selectedKeys={selectedKeys}
          inlineCollapsed={collapsed}
          className="border-r-0"
          style={{ background: 'transparent' }}
        />
      </div>
    </div>
  )
}

export default Sidebar
