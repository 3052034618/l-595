import React from 'react'
import { Card, Table, Button, Space, Tag, Progress } from 'antd'
import { PlusOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { getRiskLevelColor, getRiskLevelText, getStatusColor, getStatusText, formatDate } from '@/utils'

const RiskAssessment: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  React.useEffect(() => {
    setCurrentPage('/risk-assessment')
  }, [setCurrentPage])

  const columns = [
    {
      title: '评估期间',
      dataIndex: 'assessmentPeriod',
      key: 'assessmentPeriod',
      width: 120,
    },
    {
      title: '审计对象',
      dataIndex: 'auditObjectName',
      key: 'auditObjectName',
    },
    {
      title: '固有风险',
      dataIndex: 'inherentRisk',
      key: 'inherentRisk',
      width: 100,
      render: (val: number) => (
        <div className="text-center">
          <Progress
            type="circle"
            percent={val}
            width={40}
            strokeColor={val > 70 ? '#f5222d' : val > 40 ? '#faad14' : '#52c41a'}
          />
        </div>
      ),
    },
    {
      title: '控制有效性',
      dataIndex: 'controlEffectiveness',
      key: 'controlEffectiveness',
      width: 100,
      render: (val: number) => (
        <div className="text-center">
          <Progress
            type="circle"
            percent={val}
            width={40}
            strokeColor={val > 70 ? '#52c41a' : val > 40 ? '#faad14' : '#f5222d'}
          />
        </div>
      ),
    },
    {
      title: '剩余风险',
      dataIndex: 'residualRisk',
      key: 'residualRisk',
      width: 100,
      render: (val: number) => (
        <div className="text-center">
          <Progress
            type="circle"
            percent={val}
            width={40}
            strokeColor={val > 70 ? '#f5222d' : val > 40 ? '#faad14' : '#52c41a'}
          />
        </div>
      ),
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
      title: '评估人',
      dataIndex: 'assessor',
      key: 'assessor',
      width: 100,
    },
    {
      title: '评估日期',
      dataIndex: 'assessmentDate',
      key: 'assessmentDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small">
            查看
          </Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />}>
              执行
            </Button>
          )}
          <Button type="link" size="small">
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  const data = Array.from({ length: 8 }, (_, i) => ({
    key: i + 1,
    auditObjectId: `AO${String(i + 1).padStart(4, '0')}`,
    auditObjectName: ['财务部', 'IT部门', '采购部', '人力资源部', '销售部', '生产部', '研发部', '行政部'][i],
    assessmentPeriod: `2024年Q${Math.floor(i / 2) + 1}`,
    inherentRisk: 30 + i * 8,
    controlEffectiveness: 80 - i * 5,
    residualRisk: Math.round((30 + i * 8) * (1 - (80 - i * 5) / 100)),
    riskLevel: ['low', 'low', 'medium', 'medium', 'high', 'high', 'critical', 'critical'][i],
    assessor: ['审计员A', '审计员B', '审计员C', '审计员A', '审计员B', '审计员C', '审计员A', '审计员B'][i],
    assessmentDate: `2024-0${Math.floor(i / 2) + 1}-${15 + i}`,
    status: ['approved', 'approved', 'submitted', 'draft', 'approved', 'submitted', 'rejected', 'draft'][i],
  }))

  return (
    <div className="space-y-4">
      <Card
        className="shadow-sm"
        bordered={false}
        title="风险评估列表"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              新增评估
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  )
}

export default RiskAssessment
