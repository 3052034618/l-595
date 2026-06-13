import React from 'react'
import { Card, Table, Button, Space, Tag } from 'antd'
import { PlusOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { getStatusColor, getStatusText, formatDate } from '@/utils'

const Reports: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  React.useEffect(() => {
    setCurrentPage('/reports')
  }, [setCurrentPage])

  const columns = [
    {
      title: '报告标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '报告类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          interim: '中期报告',
          final: '最终报告',
          special: '专项报告',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '关联审计计划',
      dataIndex: 'auditPlanName',
      key: 'auditPlanName',
      width: 180,
    },
    {
      title: '生成人',
      dataIndex: 'generatedBy',
      key: 'generatedBy',
      width: 100,
    },
    {
      title: '生成日期',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      width: 120,
      render: (date: string) => (date ? formatDate(date) : '-'),
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
      width: 200,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />}>
            预览
          </Button>
          {(record.status === 'approved' || record.status === 'issued') && (
            <Button type="link" size="small" icon={<DownloadOutlined />}>
              下载
            </Button>
          )}
          {record.status === 'draft' && (
            <Button type="link" size="small">
              编辑
            </Button>
          )}
          {record.status === 'reviewing' && (
            <Button type="link" size="small">
              审核
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const data = Array.from({ length: 8 }, (_, i) => ({
    key: i + 1,
    auditPlanId: `AP${String(i + 1).padStart(4, '0')}`,
    auditPlanName: ['2024年度财务审计', '信息系统安全审计', '采购流程合规审计', '人力资源管理审计', '销售合同专项审计', '生产成本核算审计', '研发项目管理审计', '行政管理费用审计'][i],
    title: [
      '2024年度财务审计报告',
      '信息系统安全审计报告',
      '采购流程合规审计报告',
      '人力资源管理审计报告',
      '销售合同专项审计报告',
      '生产成本核算审计报告',
      '研发项目管理审计报告',
      '行政管理费用审计报告',
    ][i],
    type: ['final', 'interim', 'final', 'final', 'special', 'final', 'interim', 'final'][i],
    generatedBy: ['李审计', '王审计', '张审计', '刘审计', '陈审计', '李审计', '王审计', '张审计'][i],
    generatedAt: i > 1 ? `2024-0${Math.floor(i / 2) + 2}-15` : undefined,
    approvedBy: i > 3 ? '审计主管' : undefined,
    approvedAt: i > 3 ? `2024-0${Math.floor(i / 2) + 2}-20` : undefined,
    status: ['issued', 'approved', 'issued', 'reviewing', 'approved', 'issued', 'draft', 'reviewing'][i],
  }))

  return (
    <div className="space-y-4">
      <Card
        className="shadow-sm"
        bordered={false}
        title="报告中心"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              生成报告
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

export default Reports
