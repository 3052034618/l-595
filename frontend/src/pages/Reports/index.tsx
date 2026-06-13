import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Tag, Input, Select, DatePicker, Popconfirm, message, Modal, Form, Switch } from 'antd'
import { PlusOutlined, DownloadOutlined, EyeOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { formatDate } from '@/utils'
import { getReports, generateReport, deleteReport } from '@/services/reports'
import type { TablePaginationConfig } from 'antd/es/table'

const { RangePicker } = DatePicker
const { Option } = Select

interface ReportItem {
  id: string
  name: string
  type: string
  startDate: string
  endDate: string
  statistics: {
    totalAuditPlans: number
    completedAuditPlans: number
    totalFindings: number
    findingsByLevel: { high: number; medium: number; low: number }
    totalRectifications: number
    completedRectifications: number
    averageProcessingDays: number
    findingsRate: number
    rectificationRate: number
  }
  charts: {
    trendData: Array<{ date: string; value: number }>
    riskDistribution: Array<{ name: string; value: number; color: string }>
  }
  pdfUrl?: string
  excelUrl?: string
  generatedBy?: string
  generatedAt: string
  generatedByUser?: { id: string; name: string }
}

const getReportTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    monthly: '月度报告',
    quarterly: '季度报告',
    annual: '年度报告',
    custom: '自定义报告',
  }
  return typeMap[type] || type
}

const getReportTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    monthly: '#1890ff',
    quarterly: '#722ed1',
    annual: '#52c41a',
    custom: '#fa8c16',
  }
  return colorMap[type] || '#8c8c8c'
}

const Reports: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  useEffect(() => {
    setCurrentPage('/reports')
  }, [setCurrentPage])

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ReportItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const [type, setType] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        pageSize,
      }
      if (type) params.type = type
      if (dateRange && dateRange[0]) params.startDate = dateRange[0]
      if (dateRange && dateRange[1]) params.endDate = dateRange[1]

      const res = await getReports(params)
      if (res.code === 0 && res.data) {
        setData(res.data.items as unknown as ReportItem[])
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('获取报告列表失败:', error)
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
    setType(undefined)
    setDateRange(null)
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteReport(id)
      if (res.code === 0) {
        message.success('删除成功')
        fetchData()
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleDownloadExcel = (report: ReportItem) => {
    if (report.excelUrl) {
      window.open('http://localhost:3001' + report.excelUrl, '_blank')
    } else {
      message.warning('Excel文件暂不可用')
    }
  }

  const handleDownloadPdf = (report: ReportItem) => {
    if (report.pdfUrl) {
      window.open('http://localhost:3001' + report.pdfUrl, '_blank')
    } else if (report.excelUrl) {
      message.info('PDF暂不可用，已为您打开Excel版本')
      window.open('http://localhost:3001' + report.excelUrl, '_blank')
    } else {
      message.warning('文件暂不可用')
    }
  }

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields()
      setGenerating(true)
      const params = {
        type: values.type,
        startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        autoExport: values.autoExport ?? true,
      }
      const res = await generateReport(params)
      if (res.code === 0) {
        message.success('报告生成成功')
        setGenerateModalOpen(false)
        form.resetFields()
        fetchData()
      }
    } catch (error) {
      console.error('生成报告失败:', error)
    } finally {
      setGenerating(false)
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
      title: '报告标题',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '报告类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (t: string) => <Tag color={getReportTypeColor(t)}>{getReportTypeText(t)}</Tag>,
    },
    {
      title: '报告周期',
      key: 'period',
      width: 220,
      render: (_: unknown, record: ReportItem) => (
        <div>
          <div className="text-sm">{formatDate(record.startDate)}</div>
          <div className="text-xs text-gray-400">至 {formatDate(record.endDate)}</div>
        </div>
      ),
    },
    {
      title: '审计计划',
      key: 'plans',
      width: 120,
      render: (_: unknown, record: ReportItem) => (
        <div>
          <div>总数: {record.statistics?.totalAuditPlans ?? 0}</div>
          <div className="text-xs text-gray-400">
            完成: {record.statistics?.completedAuditPlans ?? 0}
          </div>
        </div>
      ),
    },
    {
      title: '发现问题',
      key: 'findings',
      width: 140,
      render: (_: unknown, record: ReportItem) => {
        const f = record.statistics?.findingsByLevel
        const total = record.statistics?.totalFindings ?? 0
        return (
          <div>
            <div>总数: {total}</div>
            {f && (
              <div className="text-xs">
                <span style={{ color: '#f5222d' }}>高{f.high} </span>
                <span style={{ color: '#fa8c16' }}>中{f.medium} </span>
                <span style={{ color: '#52c41a' }}>低{f.low}</span>
              </div>
            )}
          </div>
        )
      },
    },
    {
      title: '整改完成率',
      key: 'rectificationRate',
      width: 120,
      render: (_: unknown, record: ReportItem) => {
        const rate = record.statistics?.rectificationRate ?? 0
        const completed = record.statistics?.completedRectifications ?? 0
        const total = record.statistics?.totalRectifications ?? 0
        return (
          <div>
            <div>{rate.toFixed?.(1) ?? rate}%</div>
            <div className="text-xs text-gray-400">
              {completed}/{total}
            </div>
          </div>
        )
      },
    },
    {
      title: '生成人',
      key: 'generatedBy',
      width: 100,
      render: (_: unknown, record: ReportItem) => record.generatedByUser?.name || '-',
    },
    {
      title: '生成日期',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      render: () => <Tag color="#52c41a">已发布</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right' as const,
      render: (_: unknown, record: ReportItem) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}>
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileExcelOutlined />}
            onClick={() => handleDownloadExcel(record)}
          >
            Excel
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FilePdfOutlined />}
            onClick={() => handleDownloadPdf(record)}
          >
            PDF
          </Button>
          <Popconfirm
            title="确定删除该报告？"
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
            <div className="text-sm text-gray-500 mb-1">报告类型</div>
            <Select
              placeholder="请选择"
              style={{ width: 150 }}
              allowClear
              value={type}
              onChange={(val) => setType(val)}
            >
              <Option value="monthly">月度报告</Option>
              <Option value="quarterly">季度报告</Option>
              <Option value="annual">年度报告</Option>
              <Option value="custom">自定义报告</Option>
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">报告周期</div>
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
        title="报告中心"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setGenerateModalOpen(true)}>
              生成报告
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
        title="生成报告"
        open={generateModalOpen}
        onOk={handleGenerate}
        onCancel={() => {
          setGenerateModalOpen(false)
          form.resetFields()
        }}
        confirmLoading={generating}
        okText="生成"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="type"
            label="报告类型"
            rules={[{ required: true, message: '请选择报告类型' }]}
          >
            <Select placeholder="请选择报告类型">
              <Option value="monthly">月度报告</Option>
              <Option value="quarterly">季度报告</Option>
              <Option value="annual">年度报告</Option>
              <Option value="custom">自定义报告</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="autoExport" label="自动导出Excel" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Reports
