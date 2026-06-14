import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Tag, Progress, Input, Select, Popconfirm, message, Modal, Form } from 'antd'
import { PlusOutlined, PlayCircleOutlined, CheckCircleOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, SwapOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { getStatusColor, getStatusText, formatDate } from '@/utils'
import { getAuditPlans, generatePlan, reassignAuditor, deleteAuditPlan, startAudit, completeAudit } from '@/services/auditPlans'
import type { TablePaginationConfig } from 'antd/es/table'

const { Option } = Select

interface AuditPlanItem {
  id: string
  year: number
  name: string
  description?: string
  status: string
  startDate: string
  endDate: string
  auditObjectId?: string
  leadAuditorId?: string
  progress: number
  auditObject?: { id: string; name: string }
  leadAuditor?: { id: string; name: string }
  planAuditors: Array<{ auditor: { id: string; name: string } }>
  createdAt: string
}

const AuditPlans: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  useEffect(() => {
    setCurrentPage('/audit-plans')
  }, [setCurrentPage])

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AuditPlanItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const [year, setYear] = useState<number | undefined>()
  const [status, setStatus] = useState<string | undefined>()
  const [auditObjectId, setAuditObjectId] = useState<string | undefined>()
  const [keyword, setKeyword] = useState('')

  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [reassignModalOpen, setReassignModalOpen] = useState(false)
  const [reassignRecord, setReassignRecord] = useState<AuditPlanItem | null>(null)
  const [form] = Form.useForm()
  const [reassignForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        pageSize,
      }
      if (year) params.year = year
      if (status) params.status = status
      if (auditObjectId) params.auditObjectId = auditObjectId
      if (keyword) params.keyword = keyword

      const res = await getAuditPlans(params)
      if (res.code === 0 && res.data) {
        setData(res.data.items as unknown as AuditPlanItem[])
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('获取审计计划列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, year, status, auditObjectId, keyword])

  const handleSearch = () => {
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleReset = () => {
    setYear(undefined)
    setStatus(undefined)
    setAuditObjectId(undefined)
    setKeyword('')
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteAuditPlan(id)
      if (res.code === 0) {
        message.success('删除成功')
        fetchData()
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleStart = async (id: string) => {
    try {
      const res = await startAudit(id)
      if (res.code === 0) {
        message.success('已启动审计')
        fetchData()
      }
    } catch (error) {
      console.error('启动失败:', error)
    }
  }

  const handleComplete = async (id: string) => {
    try {
      const res = await completeAudit(id)
      if (res.code === 0) {
        message.success('已完成审计')
        fetchData()
      }
    } catch (error) {
      console.error('完成失败:', error)
    }
  }

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields()
      const res = await generatePlan(values)
      if (res.code === 0) {
        message.success('计划生成成功')
        setGenerateModalOpen(false)
        form.resetFields()
        fetchData()
      }
    } catch (error) {
      console.error('生成计划失败:', error)
    }
  }

  const handleReassign = (record: AuditPlanItem) => {
    setReassignRecord(record)
    setReassignModalOpen(true)
  }

  const handleReassignSubmit = async () => {
    if (!reassignRecord) return
    try {
      const values = await reassignForm.validateFields()
      const leadAuditorId = values.leadAuditorId
      const teamStr = values.teamMembers || ''
      const teamArray = teamStr
        .split(/[,，\s]+/)
        .map((s: string) => s.trim())
        .filter(Boolean)
      const auditorIds = Array.from(new Set([leadAuditorId, ...teamArray]))
      const res = await reassignAuditor(reassignRecord.id, {
        leadAuditorId,
        auditorIds,
        reason: values.reason || '调整审计资源配置',
      })
      if (res.code === 0) {
        message.success('重新分配成功，相关人员已收到通知')
        setReassignModalOpen(false)
        setReassignRecord(null)
        reassignForm.resetFields()
        fetchData()
      }
    } catch (error) {
      console.error('重新分配失败:', error)
    }
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setPage(pagination.current)
    if (pagination.pageSize) {
      setPageSize(pagination.pageSize)
      setPage(1)
    }
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  const columns = [
    {
      title: '计划编码',
      key: 'code',
      width: 120,
      render: (_: unknown, record: AuditPlanItem) => record.id.substring(0, 8).toUpperCase(),
    },
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '年度',
      dataIndex: 'year',
      key: 'year',
      width: 80,
    },
    {
      title: '审计对象',
      key: 'auditObject',
      width: 150,
      render: (_: unknown, record: AuditPlanItem) => record.auditObject?.name || '-',
    },
    {
      title: '主审计师',
      key: 'leadAuditor',
      width: 100,
      render: (_: unknown, record: AuditPlanItem) => record.leadAuditor?.name || '-',
    },
    {
      title: '团队成员',
      key: 'auditorNames',
      width: 200,
      render: (_: unknown, record: AuditPlanItem) => {
        const names = record.auditorNames || []
        if (names.length === 0) return '-'
        return (
          <Space size={4} wrap>
            {names.map((n) => (
              <Tag key={n} color="blue">{n}</Tag>
            ))}
          </Space>
        )
      },
    },
    {
      title: '计划期间',
      key: 'period',
      width: 220,
      render: (_: unknown, record: AuditPlanItem) => (
        <div>
          <div className="text-sm">{formatDate(record.startDate)}</div>
          <div className="text-xs text-gray-400">至 {formatDate(record.endDate)}</div>
        </div>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      width: 150,
      render: (_: unknown, record: AuditPlanItem) => (
        <Progress
          percent={record.progress}
          status={
            record.status === 'cancelled'
              ? 'exception'
              : record.status === 'completed'
              ? 'success'
              : 'active'
          }
        />
      ),
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
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: AuditPlanItem) => (
        <Space>
          <Button type="link" size="small">
            查看
          </Button>
          {record.status === 'approved' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStart(record.id)}>
              启动
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)}>
              完成
            </Button>
          )}
          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => handleReassign(record)}>
              分配
            </Button>
          )}
          <Popconfirm
            title="确定删除该审计计划？"
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
            <div className="text-sm text-gray-500 mb-1">关键词</div>
            <Input
              placeholder="计划名称"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">年度</div>
            <Select
              placeholder="请选择"
              style={{ width: 120 }}
              allowClear
              value={year}
              onChange={(val) => setYear(val)}
            >
              {yearOptions.map((y) => (
                <Option key={y} value={y}>
                  {y}年
                </Option>
              ))}
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
              <Option value="draft">草稿</Option>
              <Option value="approved">已批准</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
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
        title="审计计划列表"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setGenerateModalOpen(true)}>
              生成计划
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
          scroll={{ x: 1500 }}
        />
      </Card>

      <Modal
        title="生成审计计划"
        open={generateModalOpen}
        onOk={handleGenerate}
        onCancel={() => {
          setGenerateModalOpen(false)
          form.resetFields()
        }}
        okText="生成"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="计划名称" rules={[{ required: true, message: '请输入计划名称' }]}>
            <Input placeholder="请输入计划名称" />
          </Form.Item>
          <Form.Item name="auditObjectId" label="审计对象ID" rules={[{ required: true, message: '请输入审计对象ID' }]}>
            <Input placeholder="请输入审计对象ID" />
          </Form.Item>
          <Form.Item name="auditType" label="审计类型" rules={[{ required: true, message: '请选择审计类型' }]}>
            <Select placeholder="请选择审计类型">
              <Option value="financial">财务审计</Option>
              <Option value="operational">运营审计</Option>
              <Option value="compliance">合规审计</Option>
              <Option value="it">IT审计</Option>
              <Option value="special">专项审计</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="重新分配审计师"
        open={reassignModalOpen}
        onOk={handleReassignSubmit}
        onCancel={() => {
          setReassignModalOpen(false)
          setReassignRecord(null)
          reassignForm.resetFields()
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={reassignForm} layout="vertical">
          <Form.Item
            name="leadAuditorId"
            label="主审计师ID"
            rules={[{ required: true, message: '请输入主审计师ID' }]}
          >
            <Input placeholder="请输入主审计师ID" />
          </Form.Item>
          <Form.Item name="teamMembers" label="团队成员ID（逗号分隔）">
            <Input placeholder="请输入团队成员ID，多个用逗号分隔，已包含主审计师" />
          </Form.Item>
          <Form.Item name="reason" label="调整原因">
            <Input.TextArea rows={2} placeholder="请输入调整原因（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AuditPlans
