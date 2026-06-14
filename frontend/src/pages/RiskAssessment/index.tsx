import React, { useState, useEffect, useCallback } from 'react'
import { Card, Table, Button, Space, Tag, Progress, Input, Select, DatePicker, Popconfirm, message, Spin, Drawer, Descriptions } from 'antd'
import { PlusOutlined, PlayCircleOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { getRiskLevelColor, getRiskLevelText, getStatusColor, getStatusText, formatDate } from '@/utils'
import { getRiskAssessments, triggerAssessment } from '@/services/riskAssessment'
import type { TablePaginationConfig } from 'antd/es/table'

const { RangePicker } = DatePicker
const { Option } = Select

interface AssessmentItem {
  id: string
  auditObjectId: string
  auditObject?: { id: string; name: string; code: string; contactPerson: string }
  previousScore: number
  currentScore: number
  previousLevel: string
  currentLevel: string
  dimensionScores?: Record<string, number>
  riskFactors?: Array<{ id: string; factorCode: string; factorName: string; weight: number; score: number }>
  assessedAt: string
  assessedBy?: string
  assessedByUser?: { id: string; name: string }
  isManual: boolean
  inherentRisk: number
  controlEffectiveness: number
  residualRisk: number
  currentLevelDisplay?: string
  _status?: string
}

const RiskAssessment: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  useEffect(() => {
    setCurrentPage('/risk-assessment')
  }, [setCurrentPage])

  const [loading, setLoading] = useState(false)
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [data, setData] = useState<AssessmentItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const [keyword, setKeyword] = useState<string>('')
  const [riskLevel, setRiskLevel] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  const [detailRecord, setDetailRecord] = useState<AssessmentItem | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyData, setHistoryData] = useState<AssessmentItem[]>([])

  const dimensionLabels: Record<string, string> = {
    financialRisk: '财务风险',
    operationalRisk: '运营风险',
    complianceRisk: '合规风险',
    strategicRisk: '战略风险',
    reputationalRisk: '声誉风险',
  }

  const handleOpenDetail = async (record: AssessmentItem) => {
    setDetailRecord(record)
    if (record.auditObjectId) {
      setHistoryLoading(true)
      try {
        const res = await getRiskAssessments(record.auditObjectId, { page: 1, pageSize: 10 })
        if (res.code === 0 && res.data) {
          setHistoryData((res.data.items as unknown as AssessmentItem[]) || [])
        }
      } catch {
        setHistoryData([])
      } finally {
        setHistoryLoading(false)
      }
    } else {
      setHistoryData([])
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        pageSize,
      }
      if (keyword) (params as any).keyword = keyword
      if (riskLevel) (params as any).riskLevel = riskLevel
      if (dateRange && dateRange[0]) (params as any).startDate = dateRange[0]
      if (dateRange && dateRange[1]) (params as any).endDate = dateRange[1]

      const res = await getRiskAssessments(undefined, params as any)
      if (res.code === 0 && res.data) {
        const items = (res.data.items as AssessmentItem[]).map((i) => ({
          ...i,
          currentLevelDisplay: i.currentLevel,
          _status: i.isManual ? 'approved' : 'submitted',
        }))
        setData(items)
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('获取风险评估列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, riskLevel, dateRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleReset = () => {
    setKeyword('')
    setRiskLevel(undefined)
    setDateRange(null)
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleTrigger = async () => {
    setTriggerLoading(true)
    try {
      const res = await triggerAssessment()
      if (res.code === 0) {
        message.success('风险评估触发成功')
        fetchData()
      }
    } catch (error) {
      console.error('触发评估失败:', error)
      message.error('触发评估失败')
    } finally {
      setTriggerLoading(false)
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
      title: '评估期间',
      key: 'period',
      width: 130,
      render: (_: unknown, record: AssessmentItem) => {
        const d = new Date(record.assessedAt)
        return `${d.getFullYear()}年${d.getMonth() + 1}月`
      },
    },
    {
      title: '审计对象',
      key: 'auditObjectName',
      render: (_: unknown, record: AssessmentItem) => record.auditObject?.name || '-',
    },
    {
      title: '固有风险',
      dataIndex: 'inherentRisk',
      key: 'inherentRisk',
      width: 110,
      render: (val: number) =>
        val !== undefined && val !== null ? (
          <div className="text-center">
            <Progress
              type="circle"
              percent={Math.round(val)}
              width={40}
              strokeColor={val > 70 ? '#f5222d' : val > 40 ? '#faad14' : '#52c41a'}
            />
          </div>
        ) : (
          <Spin size="small" />
        ),
    },
    {
      title: '控制有效性',
      dataIndex: 'controlEffectiveness',
      key: 'controlEffectiveness',
      width: 110,
      render: (val: number) =>
        val !== undefined && val !== null ? (
          <div className="text-center">
            <Progress
              type="circle"
              percent={Math.round(val)}
              width={40}
              strokeColor={val > 70 ? '#52c41a' : val > 40 ? '#faad14' : '#f5222d'}
            />
          </div>
        ) : (
          <Spin size="small" />
        ),
    },
    {
      title: '剩余风险',
      dataIndex: 'residualRisk',
      key: 'residualRisk',
      width: 110,
      render: (val: number) =>
        val !== undefined && val !== null ? (
          <div className="text-center">
            <Progress
              type="circle"
              percent={Math.round(val)}
              width={40}
              strokeColor={val > 70 ? '#f5222d' : val > 40 ? '#faad14' : '#52c41a'}
            />
          </div>
        ) : (
          <Spin size="small" />
        ),
    },
    {
      title: '风险等级',
      dataIndex: 'currentLevel',
      key: 'riskLevel',
      width: 110,
      render: (level: string) => <Tag color={getRiskLevelColor(level)}>{getRiskLevelText(level)}</Tag>,
    },
    {
      title: '综合风险分',
      dataIndex: 'currentScore',
      key: 'currentScore',
      width: 110,
      render: (score: number) => (
        <span className="font-semibold" style={{ color: score > 70 ? '#f5222d' : score > 40 ? '#fa8c16' : '#389e0d' }}>
          {Math.round(score * 100) / 100}
        </span>
      ),
    },
    {
      title: '评估人',
      key: 'assessor',
      width: 100,
      render: (_: unknown, record: AssessmentItem) => record.assessedByUser?.name || (record.isManual ? '手动触发' : '系统自动'),
    },
    {
      title: '评估日期',
      dataIndex: 'assessedAt',
      key: 'assessmentDate',
      width: 150,
      render: (date: string) => formatDate(date),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: unknown, record: AssessmentItem) => (
        <Tag color={getStatusColor(record._status || 'approved')}>
          {getStatusText(record._status || 'approved')}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: AssessmentItem) => (
        <Button type="link" size="small" onClick={() => handleOpenDetail(record)}>
          详情
        </Button>
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
              placeholder="对象名称/编码"
              prefix={<SearchOutlined />}
              style={{ width: 180 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">风险等级</div>
            <Select
              placeholder="请选择"
              style={{ width: 120 }}
              allowClear
              value={riskLevel}
              onChange={(val) => setRiskLevel(val)}
            >
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">评估日期</div>
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
        title="风险评估列表"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              新增评估
            </Button>
            <Button
              type="primary"
              danger
              icon={<PlayCircleOutlined />}
              onClick={handleTrigger}
              loading={triggerLoading}
            >
              触发全面评估
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          onRow={(record) => ({ onClick: () => handleOpenDetail(record) })}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Drawer
        title="评估详情"
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        width={640}
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="审计对象">{detailRecord?.auditObject?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="对象编码">{detailRecord?.auditObject?.code || '-'}</Descriptions.Item>
          <Descriptions.Item label="综合风险分">
            <span style={{ color: (detailRecord?.currentScore ?? 0) > 70 ? '#f5222d' : (detailRecord?.currentScore ?? 0) > 40 ? '#fa8c16' : '#389e0d', fontWeight: 600 }}>
              {detailRecord?.currentScore !== undefined ? Math.round(detailRecord.currentScore * 100) / 100 : '-'}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="风险等级">
            {detailRecord?.currentLevel ? <Tag color={getRiskLevelColor(detailRecord.currentLevel)}>{getRiskLevelText(detailRecord.currentLevel)}</Tag> : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="评估日期">{detailRecord?.assessedAt ? formatDate(detailRecord.assessedAt) : '-'}</Descriptions.Item>
          <Descriptions.Item label="评估人">{detailRecord?.assessedByUser?.name || (detailRecord?.isManual ? '手动触发' : '系统自动')}</Descriptions.Item>
        </Descriptions>

        <h4 style={{ marginTop: 20, marginBottom: 8 }}>风险因子</h4>
        <Table
          dataSource={detailRecord?.riskFactors || []}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            { title: '风险因子', dataIndex: 'factorName', key: 'factorName' },
            { title: '因子代码', dataIndex: 'factorCode', key: 'factorCode' },
            { title: '权重', dataIndex: 'weight', key: 'weight', render: (v: number) => v !== undefined ? `${v}` : '-' },
            { title: '评分', dataIndex: 'score', key: 'score', render: (v: number) => v !== undefined ? `${v}` : '-' },
          ]}
        />

        <h4 style={{ marginTop: 20, marginBottom: 8 }}>维度评分</h4>
        <Descriptions column={2} bordered size="small">
          {detailRecord?.dimensionScores && Object.entries(detailRecord.dimensionScores).map(([key, value]) => (
            <Descriptions.Item key={key} label={dimensionLabels[key] || key}>
              {value !== undefined ? value : '-'}
            </Descriptions.Item>
          ))}
          {(!detailRecord?.dimensionScores || Object.keys(detailRecord.dimensionScores).length === 0) && (
            <Descriptions.Item label="暂无数据">-</Descriptions.Item>
          )}
        </Descriptions>

        <h4 style={{ marginTop: 20, marginBottom: 8 }}>同一对象历史评估</h4>
        <Table
          dataSource={historyData}
          rowKey="id"
          loading={historyLoading}
          pagination={false}
          size="small"
          rowClassName={(record) => record.id === detailRecord?.id ? 'ant-table-row-selected' : ''}
          columns={[
            { title: '评估日期', dataIndex: 'assessedAt', key: 'assessedAt', render: (date: string) => formatDate(date) },
            { title: '综合分', dataIndex: 'currentScore', key: 'currentScore', render: (v: number) => v !== undefined ? Math.round(v * 100) / 100 : '-' },
            { title: '风险等级', dataIndex: 'currentLevel', key: 'currentLevel', render: (level: string) => <Tag color={getRiskLevelColor(level)}>{getRiskLevelText(level)}</Tag> },
            { title: '评估人', key: 'assessor', render: (_: unknown, r: AssessmentItem) => r.assessedByUser?.name || (r.isManual ? '手动触发' : '系统自动') },
          ]}
        />
      </Drawer>
    </div>
  )
}

export default RiskAssessment
