import { useState, useEffect } from 'react'
import { Layout, Button, Dropdown, Avatar, Badge, Space, message } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import { useAppStore } from '@/store/appStore'
import { formatDateTime } from '@/utils'
import type { MenuProps } from 'antd'

const { Header: AntHeader } = Layout

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, logoutUser } = useUserStore()
  const {
    collapsed,
    setCollapsed,
    notifications,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markNotificationRead,
    startPolling,
    stopPolling,
  } = useAppStore()
  const [notificationOpen, setNotificationOpen] = useState(false)

  useEffect(() => {
    fetchUnreadCount()
    startPolling()
    return () => {
      stopPolling()
    }
  }, [fetchUnreadCount, startPolling, stopPolling])

  useEffect(() => {
    if (notificationOpen) {
      fetchNotifications()
    }
  }, [notificationOpen, fetchNotifications])

  const handleLogout = async () => {
    try {
      await logoutUser()
      message.success('退出登录成功')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => message.info('个人信息功能开发中'),
    },
    {
      key: 'password',
      icon: <LockOutlined />,
      label: '修改密码',
      onClick: () => message.info('修改密码功能开发中'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => message.info('系统设置功能开发中'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
      danger: true,
    },
  ]

  const notificationMenuItems: MenuProps['items'] =
    notifications.length > 0
      ? notifications.map((notification) => ({
          key: notification.id,
          label: (
            <div className="py-2">
              <div className="font-medium text-sm">{notification.title}</div>
              <div className="text-xs text-gray-500 mt-1">{notification.content}</div>
              <div className="text-xs text-gray-400 mt-1">
                {formatDateTime(notification.createdAt)}
              </div>
            </div>
          ),
          onClick: () => {
            if (!notification.isRead) {
              markNotificationRead(notification.id)
            }
          },
        }))
      : [
          {
            key: 'empty',
            label: <div className="text-center py-4 text-gray-500">暂无通知</div>,
            disabled: true,
          },
        ]

  return (
    <AntHeader className="bg-white px-4 flex items-center justify-between shadow-sm">
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        className="text-lg"
      />

      <div className="flex items-center gap-4">
        <Dropdown
          menu={{ items: notificationMenuItems }}
          trigger={['click']}
          onOpenChange={setNotificationOpen}
          placement="bottomRight"
          dropdownRender={(menu) => (
            <div className="w-80">
              <div className="px-4 py-2 border-b border-gray-100 font-medium">
                通知中心
              </div>
              <div className="max-h-96 overflow-y-auto">{menu}</div>
              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <Button type="link" size="small" onClick={() => navigate('/notifications')}>
                  查看全部
                </Button>
              </div>
            </div>
          )}
        >
          <Badge count={unreadCount} overflowCount={99}>
            <Button type="text" icon={<BellOutlined className="text-lg" />} />
          </Badge>
        </Dropdown>

        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <Space className="cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
            <Avatar size="small" icon={<UserOutlined />} src={undefined} />
            <span className="text-sm">{user?.name || user?.username}</span>
          </Space>
        </Dropdown>
      </div>
    </AntHeader>
  )
}

export default Header
