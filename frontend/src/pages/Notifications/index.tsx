import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Tabs,
  Select,
  message,
  Popconfirm,
  Badge,
} from 'antd'
import { CheckOutlined, DeleteOutlined, ReadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { formatDateTime, getStatusColor } from '@/utils'
import type { Notification } from '@/types'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '@/services/notifications'

const { TabPane } = Tabs
const { Option } = Select

const typeMap: Record<string, string> = {
  system: '系统通知',
  alert: '预警通知',
  task: '任务通知',
  audit_change: '审计变更',
  message: '消息通知',
}

const priorityMap: Record<string, { text: string; color: string }> = {
  urgent: { text: '紧急', color: '#f5222d' },
  high: { text: '高', color: '#fa8c16' },
  medium: { text: '中', color: '#faad14' },
  low: { text: '低', color: '#52c41a' },
}

const relatedTypeMap: Record<string, string> = {
  audit_plan: '/audit-plans',
  rectification: '/rectifications',
  finding: '/findings',
  evidence: '/evidences',
  report: '/reports',
  risk_assessment: '/risk-assessment',
  audit_object: '/audit-objects',
}

const Notifications: React.FC = () => {
  const navigate = useNavigate()
  const { setCurrentPage, fetchUnreadCount } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [readStatus, setReadStatus] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  React.useEffect(() => {
    setCurrentPage('/notifications')
  }, [setCurrentPage])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        pageSize,
      }
      if (readStatus === 'unread') params.isRead = false
      if (readStatus === 'read') params.isRead = true
      if (typeFilter !== 'all') params.type = typeFilter

      const response = await getNotifications(params)
      setData(response.data.items)
      setTotal(response.data.total)
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      console.error('Fetch notifications error:', error)
      message.error('获取通知列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, readStatus, typeFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
      message.success('标记已读成功')
      fetchData()
      fetchUnreadCount()
    } catch (error) {
      console.error('Mark as read error:', error)
      message.error('标记已读失败')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      message.success('全部标记已读成功')
      fetchData()
      fetchUnreadCount()
    } catch (error) {
      console.error('Mark all as read error:', error)
      message.error('全部标记已读失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id)
      message.success('删除成功')
      fetchData()
      fetchUnreadCount()
    } catch (error) {
      console.error('Delete notification error:', error)
      message.error('删除失败')
    }
  }

  const handleTitleClick = (record: Notification) => {
    if (!record.isRead) {
      handleMarkAsRead(record.id)
    }
    if (record.relatedType && record.relatedId) {
      const path = relatedTypeMap[record.relatedType]
      if (path) {
        navigate(path)
      }
    }
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text: string, record: Notification) => (
        <span
          className={`cursor-pointer hover:text-blue-600 ${
            record.isRead ? 'text-gray-600' : 'font-semibold text-gray-900'
          }`}
          onClick={() => handleTitleClick(record)}
        >
          {!record.isRead && (
            <Badge status="processing" className="mr-2" />
          )}
          {text}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const colors: Record<string, string> = {
          system: 'blue',
          alert: 'red',
          task: 'purple',
          audit_change: 'orange',
          message: 'cyan',
        }
        return <Tag color={colors[type] || 'default'}>{typeMap[type] || type}</Tag>
      },
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const p = priorityMap[priority] || priorityMap.medium
        return (
          <span style={{ color: p.color, fontWeight: 500 }}>
            {p.text}
          </span>
        )
      },
    },
    {
      title: '已读状态',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 100,
      render: (isRead: boolean) => (
        <Tag color={isRead ? 'default' : 'processing'}>
          {isRead ? '已读' : '未读'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: Notification) => (
        <Space>
          {!record.isRead && (
            <Button
              type="link"
              size="small"
              icon={<ReadOutlined />}
              onClick={() => handleMarkAsRead(record.id)}
            >
              已读
            </Button>
          )}
          <Popconfirm
            title="确定删除这条通知吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card
        className="shadow-sm"
        bordered={false}
        title={
          <div className="flex items-center justify-between w-full">
            <span>通知中心</span>
            <span className="text-sm font-normal text-gray-500">
              未读: <span className="text-red-500 font-medium">{unreadCount}</span> 条
            </span>
          </div>
        }
        extra={
          <Space>
            <Select
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value)
                setPage(1)
              }}
              style={{ width: 140 }}
              allowClear={false}
            >
              <Option value="all">全部类型</Option>
              <Option value="system">系统通知</Option>
              <Option value="alert">预警通知</Option>
              <Option value="task">任务通知</Option>
              <Option value="audit_change">审计变更</Option>
            </Select>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              全部标记已读
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={readStatus}
          onChange={(key) => {
            setReadStatus(key as 'all' | 'unread' | 'read')
            setPage(1)
          }}
          className="mb-4"
        >
          <TabPane tab="全部" key="all" />
          <TabPane tab={`未读 (${unreadCount})`} key="unread" />
          <TabPane tab="已读" key="read" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (p, ps) => {
              setPage(p)
              setPageSize(ps)
            },
          }}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  )
}

export default Notifications
