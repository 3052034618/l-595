import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Tag, Input, Select, DatePicker, Popconfirm, message, Modal, Form, Input as AntInput } from 'antd'
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { getRiskLevelColor, getRiskLevelText, getStatusColor, getStatusText, formatDate } from '@/utils'
import { getFindings, createFinding, confirmFinding, deleteFinding } from '@/services/findings'
import type { TablePaginationConfig } from 'antd/es/table'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = AntInput

interface FindingItem {
  id: string
  title: string
  description: string
  auditPlanId?: string
  auditObjectId?: string
  riskLevel: string
  riskScore?: number
  category?: string
  status: string
  discoveredBy?: string
  discoveredAt: string
  confirmedBy?: string
  confirmedAt?: string
  confirmComment?: string
  auditPlan?: { id: string; name: string }
  auditObject?: { id: string; name: string }
  discoveredByUser?: { id: string; name: string }
  confirmedByUser?: { id: string; name: string }
  createdAt: string
}

const Findings: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  useEffect(() => {
    setCurrentPage('/findings')
  }, [setCurrentPage])

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FindingItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const [auditPlanId, setAuditPlanId] = useState<string | undefined>()
  const [auditObjectId, setAuditObjectId] = useState<string | undefined>()
  const [riskLevel, setRiskLevel] = useState<string | undefined>()
  const [status, setStatus] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmRecord, setConfirmRecord] = useState<FindingItem | null>(null)
  const [confirmType, setConfirmType] = useState<'confirm' | 'reject'>('confirm')
  const [form] = Form.useForm()
  const [confirmForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        pageSize,
      }
      if (auditPlanId) params.auditPlanId = auditPlanId
      if (auditObjectId) params.auditObjectId = auditObjectId
      if (riskLevel) params.riskLevel = riskLevel
      if (status) params.status = status
      if (dateRange && dateRange[0]) params.startDate = dateRange[0]
      if (dateRange && dateRange[1]) params.endDate = dateRange[1]

      const res = await getFindings(params)
      if (res.code === 0 && res.data) {
        setData(res.data.items as unknown as FindingItem[])
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('获取审计发现列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize])

  const handleSearch = () => {
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleReset = () => {
    setAuditPlanId(undefined)
    setAuditObjectId(undefined)
    setRiskLevel(undefined)
    setStatus(undefined)
    setDateRange(null)
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteFinding(id)
      if (res.code === 0) {
        message.success('删除成功')
        fetchData()
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      const res = await createFinding(values)
      if (res.code === 0) {
        message.success('创建成功')
        setCreateModalOpen(false)
        form.resetFields()
        fetchData()
      }
    } catch (error) {
      console.error('创建失败:', error)
    }
  }

  const handleOpenConfirm = (record: FindingItem, type: 'confirm' | 'reject') => {
    setConfirmRecord(record)
    setConfirmType(type)
    setConfirmModalOpen(true)
  }

  const handleConfirmSubmit = async () => {
    if (!confirmRecord) return
    try {
      const values = await confirmForm.validateFields()
      const res = await confirmFinding(confirmRecord.id, {
        confirmed: confirmType === 'confirm',
        comment: values.comment,
      })
      if (res.code === 0) {
        message.success(confirmType === 'confirm' ? '确认成功' : '已拒绝')
        setConfirmModalOpen(false)
        setConfirmRecord(null)
        confirmForm.resetFields()
        fetchData()
      }
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setPage(pagination.current)
    if (pagination.pageSize) {
      setPageSize(pagination.pageSize)
      setPage(1)
    }
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: string) => (
        <Tag color={getRiskLevelColor(level)}>{getRiskLevelText(level)}</Tag>
      ),
    },
    {
      title: '风险分数',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 90,
      render: (val?: number) => val ?? '-',
    },
    {
      title: '审计对象',
      key: 'auditObject',
      width: 120,
      render: (_: unknown, record: FindingItem) => record.auditObject?.name || '-',
    },
    {
      title: '关联审计计划',
      key: 'auditPlan',
      width: 180,
      render: (_: unknown, record: FindingItem) => record.auditPlan?.name || '-',
    },
    {
      title: '报告人',
      key: 'reportedBy',
      width: 100,
      render: (_: unknown, record: FindingItem) => record.discoveredByUser?.name || '-',
    },
    {
      title: '报告日期',
      dataIndex: 'discoveredAt',
      key: 'discoveredAt',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => (
        <Tag color={getStatusColor(s)}>{getStatusText(s)}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right' as const,
      render: (_: unknown, record: FindingItem) => (
        <Space>
          <Button type="link" size="small">
            查看
          </Button>
          {record.status === 'pending_confirmation' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleOpenConfirm(record, 'confirm')}
            >
              确认
            </Button>
          )}
          {record.status === 'pending_confirmation' && (
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleOpenConfirm(record, 'reject')}
            >
              拒绝
            </Button>
          )}
          {record.status === 'rectifying' && (
            <Button type="link" size="small">
              整改
            </Button>
          )}
          <Popconfirm
            title="确定删除该审计发现？"
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
      <Card className="shadow-sm" bordered={false}>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <div className="text-sm text-gray-500 mb-1">审计计划ID</div>
            <Input
              placeholder="请输入审计计划ID"
              style={{ width: 180 }}
              value={auditPlanId}
              onChange={(e) => setAuditPlanId(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">审计对象ID</div>
            <Input
              placeholder="请输入审计对象ID"
              style={{ width: 180 }}
              value={auditObjectId}
              onChange={(e) => setAuditObjectId(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">风险等级</div>
            <Select
              placeholder="请选择"
              style={{ width: 150 }}
              allowClear
              value={riskLevel}
              onChange={(val) => setRiskLevel(val)}
            >
              <Option value="low">低风险</Option>
              <Option value="medium">中风险</Option>
              <Option value="high">高风险</Option>
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">状态</div>
            <Select
              placeholder="请选择"
              style={{ width: 150 }}
              allowClear
              value={status}
              onChange={(val) => setStatus(val)}
            >
              <Option value="pending_confirmation">待确认</Option>
              <Option value="confirmed">已确认</Option>
              <Option value="rectifying">整改中</Option>
              <Option value="closed">已关闭</Option>
              <Option value="rejected">已拒绝</Option>
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">发现日期</div>
            <RangePicker
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')])
                } else {
                  setDateRange(null)
                }
              }}
            />
          </div>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
        </div>
      </Card>

      <Card
        className="shadow-sm"
        bordered={false}
        title="审计发现列表"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              新增发现
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1600 }}
        />
      </Card>

      <Modal
        title="新增审计发现"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalOpen(false)
          form.resetFields()
        }}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true, message: '请输入描述' }]}>
            <TextArea rows={4} placeholder="请输入描述" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="auditObjectId" label="审计对象ID">
              <Input placeholder="请输入审计对象ID" />
            </Form.Item>
            <Form.Item name="auditPlanId" label="审计计划ID">
              <Input placeholder="请输入审计计划ID" />
            </Form.Item>
            <Form.Item name="riskLevel" label="风险等级" rules={[{ required: true, message: '请选择风险等级' }]}>
              <Select placeholder="请选择风险等级">
                <Option value="low">低风险</Option>
                <Option value="medium">中风险</Option>
                <Option value="high">高风险</Option>
              </Select>
            </Form.Item>
            <Form.Item name="category" label="分类">
              <Input placeholder="请输入分类" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title={confirmType === 'confirm' ? '确认审计发现' : '拒绝审计发现'}
        open={confirmModalOpen}
        onOk={handleConfirmSubmit}
        onCancel={() => {
          setConfirmModalOpen(false)
          setConfirmRecord(null)
          confirmForm.resetFields()
        }}
        okText={confirmType === 'confirm' ? '确认' : '拒绝'}
        cancelText="取消"
      >
        <Form form={confirmForm} layout="vertical">
          <Form.Item name="comment" label="备注">
            <TextArea rows={3} placeholder={confirmType === 'confirm' ? '请输入确认备注（可选）' : '请输入拒绝原因'} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Findings
