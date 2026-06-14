import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Progress,
  Input,
  Select,
  DatePicker,
  Switch,
  Popconfirm,
  message,
  Modal,
  Form,
  Slider,
  Input as AntInput,
  Steps,
} from 'antd'
import {
  PlusOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { formatDate } from '@/utils'
import {
  getRectifications,
  createRectification,
  addRectificationUpdate,
  verifyCompletion,
  deleteRectification,
} from '@/services/rectifications'
import type { TablePaginationConfig } from 'antd/es/table'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = AntInput

interface RectificationItem {
  id: string
  findingId: string
  auditObjectId?: string
  plan: string
  measures: string[]
  responsiblePersonId?: string
  expectedCompletionDate: string
  actualCompletionDate?: string
  expectedEffect?: string
  status: string
  progress: number
  isOverdue: boolean
  escalationLevel: number
  createdAt: string
  updatedAt: string
  finding?: { id: string; title: string; riskLevel: string }
  auditObject?: { id: string; name: string }
  responsiblePerson?: { id: string; name: string }
  rectificationUpdates?: Array<{ id: string; progress: number; description: string; createdAt: string }>
}

const STATUS_STEP_MAP: Record<string, number> = {
  draft: 0,
  in_progress: 0,
  submitted: 1,
  completed: 2,
  rejected: 0,
}

const Rectifications: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  useEffect(() => {
    setCurrentPage('/rectifications')
  }, [setCurrentPage])

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RectificationItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const [auditObjectId, setAuditObjectId] = useState<string | undefined>()
  const [responsiblePersonId, setResponsiblePersonId] = useState<string | undefined>()
  const [status, setStatus] = useState<string | undefined>()
  const [isOverdue, setIsOverdue] = useState<boolean | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [updateRecord, setUpdateRecord] = useState<RectificationItem | null>(null)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [verifyRecord, setVerifyRecord] = useState<RectificationItem | null>(null)
  const [verifyType, setVerifyType] = useState<'pass' | 'reject'>('pass')
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [submitRecord, setSubmitRecord] = useState<RectificationItem | null>(null)
  const [form] = Form.useForm()
  const [updateForm] = Form.useForm()
  const [verifyForm] = Form.useForm()
  const [submitForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        pageSize,
      }
      if (auditObjectId) params.auditObjectId = auditObjectId
      if (responsiblePersonId) params.responsiblePersonId = responsiblePersonId
      if (status) params.status = status
      if (isOverdue !== undefined) params.isOverdue = isOverdue
      if (dateRange && dateRange[0]) params.startDate = dateRange[0]
      if (dateRange && dateRange[1]) params.endDate = dateRange[1]

      const res = await getRectifications(params)
      if (res.code === 0 && res.data) {
        setData(res.data.items as unknown as RectificationItem[])
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('获取整改跟踪列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, auditObjectId, responsiblePersonId, status, isOverdue, dateRange])

  const handleSearch = () => {
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleReset = () => {
    setAuditObjectId(undefined)
    setResponsiblePersonId(undefined)
    setStatus(undefined)
    setIsOverdue(undefined)
    setDateRange(null)
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteRectification(id)
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
      const submitData = {
        ...values,
        measures: values.measures ? values.measures.split('\n').filter(Boolean) : [],
      }
      const res = await createRectification(submitData)
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

  const handleOpenUpdate = (record: RectificationItem) => {
    setUpdateRecord(record)
    updateForm.setFieldsValue({
      progress: record.progress,
      description: '',
    })
    setUpdateModalOpen(true)
  }

  const handleUpdateSubmit = async () => {
    if (!updateRecord) return
    try {
      const values = await updateForm.validateFields()
      const res = await addRectificationUpdate(updateRecord.id, values)
      if (res.code === 0) {
        message.success('进度更新成功')
        setUpdateModalOpen(false)
        setUpdateRecord(null)
        updateForm.resetFields()
        fetchData()
      }
    } catch (error) {
      console.error('更新失败:', error)
    }
  }

  const handleOpenVerify = (record: RectificationItem, type: 'pass' | 'reject') => {
    setVerifyRecord(record)
    setVerifyType(type)
    verifyForm.resetFields()
    setVerifyModalOpen(true)
  }

  const handleVerifySubmit = async () => {
    if (!verifyRecord) return
    try {
      const values = await verifyForm.validateFields()
      const res = await verifyCompletion(verifyRecord.id, {
        passed: verifyType === 'pass',
        comment: values.comment,
      })
      if (res.code === 0) {
        message.success(verifyType === 'pass' ? '验证通过，整改已完成' : '已驳回，请继续整改')
        setVerifyModalOpen(false)
        setVerifyRecord(null)
        verifyForm.resetFields()
        fetchData()
      }
    } catch (error) {
      console.error('验证失败:', error)
    }
  }

  const handleOpenSubmit = (record: RectificationItem) => {
    setSubmitRecord(record)
    submitForm.resetFields()
    setSubmitModalOpen(true)
  }

  const handleSubmitVerify = async () => {
    if (!submitRecord) return
    try {
      const values = await submitForm.validateFields()
      const res = await addRectificationUpdate(submitRecord.id, {
        progress: 100,
        description: values.comment || '提交验证',
      })
      if (res.code === 0) {
        message.success('已提交验证，等待审核')
        setSubmitModalOpen(false)
        setSubmitRecord(null)
        submitForm.resetFields()
        fetchData()
      }
    } catch (error) {
      console.error('提交验证失败:', error)
    }
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setPage(pagination.current)
    if (pagination.pageSize) {
      setPageSize(pagination.pageSize)
      setPage(1)
    }
  }

  const renderStatusSteps = (record: RectificationItem) => {
    if (record.isOverdue) {
      return <Tag color="red">已超期</Tag>
    }

    if (record.status === 'rejected') {
      return (
        <Space size={2}>
          <Tag color="red">已驳回</Tag>
          <Tag color="blue">继续整改中</Tag>
        </Space>
      )
    }

    const currentStep = STATUS_STEP_MAP[record.status] ?? 0

    const stepConfig = [
      { title: '整改中', color: currentStep === 0 ? 'blue' : undefined },
      { title: '待验证', color: currentStep === 1 ? 'orange' : undefined },
      { title: '已完成', color: currentStep === 2 ? 'green' : undefined },
    ]

    return (
      <Steps
        size="small"
        current={currentStep}
        items={stepConfig.map((s, idx) => ({
          title: (
            <span style={{ color: idx === currentStep ? undefined : '#8c8c8c', fontSize: 12 }}>
              {s.title}
            </span>
          ),
        }))}
        style={{ minWidth: 180 }}
      />
    )
  }

  const columns = [
    {
      title: '整改描述',
      dataIndex: 'plan',
      key: 'plan',
      ellipsis: true,
    },
    {
      title: '关联发现',
      key: 'finding',
      width: 220,
      ellipsis: true,
      render: (_: unknown, record: RectificationItem) => record.finding?.title || '-',
    },
    {
      title: '风险等级',
      key: 'findingRisk',
      width: 100,
      render: (_: unknown, record: RectificationItem) => {
        if (!record.finding?.riskLevel) return '-'
        const colors: Record<string, string> = {
          low: '#52c41a',
          medium: '#faad14',
          high: '#fa8c16',
          critical: '#f5222d',
        }
        const texts: Record<string, string> = {
          low: '低',
          medium: '中',
          high: '高',
          critical: '极高',
        }
        return <Tag color={colors[record.finding.riskLevel]}>{texts[record.finding.riskLevel]}</Tag>
      },
    },
    {
      title: '责任部门',
      key: 'auditObject',
      width: 120,
      render: (_: unknown, record: RectificationItem) => record.auditObject?.name || '-',
    },
    {
      title: '责任人',
      key: 'responsiblePerson',
      width: 100,
      render: (_: unknown, record: RectificationItem) => record.responsiblePerson?.name || '-',
    },
    {
      title: '截止日期',
      dataIndex: 'expectedCompletionDate',
      key: 'expectedCompletionDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '进度',
      key: 'progress',
      width: 160,
      render: (_: unknown, record: RectificationItem) => (
        <Progress
          percent={record.progress}
          status={
            record.status === 'completed'
              ? 'success'
              : record.status === 'rejected' || record.isOverdue
              ? 'exception'
              : 'active'
          }
        />
      ),
    },
    {
      title: '升级级别',
      dataIndex: 'escalationLevel',
      key: 'escalationLevel',
      width: 90,
      render: (level: number) => `L${level}`,
    },
    {
      title: '状态',
      key: 'status',
      width: 200,
      render: (_: unknown, record: RectificationItem) => renderStatusSteps(record),
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      fixed: 'right' as const,
      render: (_: unknown, record: RectificationItem) => (
        <Space>
          <Button type="link" size="small">
            查看
          </Button>
          <Button type="link" size="small" icon={<MessageOutlined />}>
            评论
          </Button>
          {(record.status === 'in_progress' || record.status === 'draft' || record.status === 'rejected') && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenUpdate(record)}
            >
              更新进度
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button
              type="link"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleOpenSubmit(record)}
            >
              提交验证
            </Button>
          )}
          {record.status === 'submitted' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleOpenVerify(record, 'pass')}
            >
              验证通过
            </Button>
          )}
          {record.status === 'submitted' && (
            <Button
              type="link"
              size="small"
              danger
              onClick={() => handleOpenVerify(record, 'reject')}
            >
              驳回
            </Button>
          )}
          <Popconfirm
            title="确定删除该整改项？"
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
            <div className="text-sm text-gray-500 mb-1">责任人ID</div>
            <Input
              placeholder="请输入责任人ID"
              style={{ width: 150 }}
              value={responsiblePersonId}
              onChange={(e) => setResponsiblePersonId(e.target.value)}
              allowClear
            />
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
              <Option value="in_progress">整改中</Option>
              <Option value="submitted">待验证</Option>
              <Option value="completed">已完成</Option>
              <Option value="overdue">已超期</Option>
              <Option value="rejected">已驳回</Option>
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">仅显示超期</div>
            <Switch
              checked={isOverdue || false}
              onChange={(checked) => setIsOverdue(checked ? true : undefined)}
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">创建日期</div>
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
        title="整改跟踪列表"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              新增整改
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
          scroll={{ x: 1900 }}
        />
      </Card>

      <Modal
        title="新增整改项"
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
          <Form.Item name="findingId" label="关联发现ID" rules={[{ required: true, message: '请输入关联发现ID' }]}>
            <Input placeholder="请输入关联发现ID" />
          </Form.Item>
          <Form.Item name="plan" label="整改计划" rules={[{ required: true, message: '请输入整改计划' }]}>
            <TextArea rows={3} placeholder="请输入整改计划描述" />
          </Form.Item>
          <Form.Item name="measures" label="具体措施（每行一条）" rules={[{ required: true, message: '请输入具体措施' }]}>
            <TextArea rows={3} placeholder="每行一条具体措施" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="responsiblePersonId" label="责任人ID">
              <Input placeholder="请输入责任人ID" />
            </Form.Item>
            <Form.Item name="expectedCompletionDate" label="截止日期" rules={[{ required: true, message: '请选择截止日期' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="expectedEffect" label="预期效果">
            <TextArea rows={2} placeholder="请输入预期效果" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="更新整改进度"
        open={updateModalOpen}
        onOk={handleUpdateSubmit}
        onCancel={() => {
          setUpdateModalOpen(false)
          setUpdateRecord(null)
          updateForm.resetFields()
        }}
        okText="更新"
        cancelText="取消"
      >
        <Form form={updateForm} layout="vertical">
          <Form.Item name="progress" label="进度 (%)" rules={[{ required: true, message: '请设置进度' }]}>
            <Slider
              min={0}
              max={100}
              marks={{ 0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100%' }}
            />
          </Form.Item>
          <Form.Item name="description" label="进度说明" rules={[{ required: true, message: '请输入进度说明' }]}>
            <TextArea rows={3} placeholder="请详细描述当前进度情况" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交验证"
        open={submitModalOpen}
        onOk={handleSubmitVerify}
        onCancel={() => {
          setSubmitModalOpen(false)
          setSubmitRecord(null)
          submitForm.resetFields()
        }}
        okText="确认提交"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16, color: '#595959' }}>
          确认将整改项提交验证？提交后进度将更新为 100%，状态变为"待验证"。
        </div>
        <Form form={submitForm} layout="vertical">
          <Form.Item name="comment" label="备注说明（可选）">
            <TextArea rows={3} placeholder="请输入提交验证的备注说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={verifyType === 'pass' ? '验证整改结果' : '驳回整改'}
        open={verifyModalOpen}
        onOk={handleVerifySubmit}
        onCancel={() => {
          setVerifyModalOpen(false)
          setVerifyRecord(null)
          verifyForm.resetFields()
        }}
        okText={verifyType === 'pass' ? '通过' : '驳回'}
        cancelText="取消"
      >
        <Form form={verifyForm} layout="vertical">
          <Form.Item name="comment" label={verifyType === 'pass' ? '验证意见（可选）' : '驳回原因'} rules={verifyType === 'reject' ? [{ required: true, message: '请输入驳回原因' }] : []}>
            <TextArea rows={3} placeholder={verifyType === 'pass' ? '请输入验证意见' : '请详细说明驳回原因'} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Rectifications
