import React from 'react'
import { Card, Table, Button, Space, Tag, Progress } from 'antd'
import { PlusOutlined, PlayCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { getStatusColor, getStatusText, formatDate } from '@/utils'

const AuditPlans: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  React.useEffect(() => {
    setCurrentPage('/audit-plans')
  }, [setCurrentPage])

  const columns = [
    {
      title: '计划编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '计划名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '审计类型',
      dataIndex: 'auditType',
      key: 'auditType',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          financial: '财务审计',
          operational: '运营审计',
          compliance: '合规审计',
          it: 'IT审计',
          special: '专项审计',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '审计对象',
      dataIndex: 'auditObjectName',
      key: 'auditObjectName',
      width: 150,
    },
    {
      title: '主审计师',
      dataIndex: 'leadAuditor',
      key: 'leadAuditor',
      width: 100,
    },
    {
      title: '计划期间',
      key: 'period',
      width: 220,
      render: (_, record) => (
        <div>
          <div className="text-sm">{formatDate(record.planStartDate)}</div>
          <div className="text-xs text-gray-400">至 {formatDate(record.planEndDate)}</div>
        </div>
      ),
    },
    {
      title: '进度',
      key: 'progress',
      width: 150,
      render: (_, record) => {
        const progressMap: Record<string, number> = {
          draft: 0,
          approved: 10,
          in_progress: 50,
          completed: 100,
          cancelled: 0,
        }
        return (
          <Progress
            percent={progressMap[record.status] || 0}
            status={record.status === 'cancelled' ? 'exception' : record.status === 'completed' ? 'success' : 'active'}
          />
        )
      },
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
          <Button type="link" size="small">
            查看
          </Button>
          {record.status === 'approved' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />}>
              启动
            </Button>
          )}
          {record.status === 'in_progress' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />}>
              完成
            </Button>
          )}
          {record.status === 'draft' && (
            <Button type="link" size="small">
              编辑
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const data = Array.from({ length: 10 }, (_, i) => ({
    key: i + 1,
    code: `AP${String(i + 1).padStart(4, '0')}`,
    name: [
      '2024年度财务审计',
      '信息系统安全审计',
      '采购流程合规审计',
      '人力资源管理审计',
      '销售合同专项审计',
      '生产成本核算审计',
      '研发项目管理审计',
      '行政管理费用审计',
      '合同管理制度审计',
      '内部控制评价审计',
    ][i],
    auditType: ['financial', 'it', 'compliance', 'operational', 'special', 'financial', 'operational', 'financial', 'compliance', 'special'][i],
    auditObjectId: `AO${String(i + 1).padStart(4, '0')}`,
    auditObjectName: ['财务部', 'IT部门', '采购部', '人力资源部', '销售部', '生产部', '研发部', '行政部', '法务部', '审计部'][i],
    leadAuditor: ['李审计', '王审计', '张审计', '刘审计', '陈审计', '李审计', '王审计', '张审计', '刘审计', '陈审计'][i],
    teamMembers: ['审计员A,审计员B', '审计员C,审计员D', '审计员A,审计员C', '审计员B,审计员D', '审计员A,审计员B', '审计员C,审计员D', '审计员A,审计员C', '审计员B,审计员D', '审计员A,审计员B', '审计员C,审计员D'],
    planStartDate: `2024-0${Math.floor(i / 3) + 1}-01`,
    planEndDate: `2024-0${Math.floor(i / 3) + 2}-28`,
    actualStartDate: i > 2 ? `2024-0${Math.floor(i / 3) + 1}-05` : undefined,
    actualEndDate: i > 5 ? `2024-0${Math.floor(i / 3) + 2}-25` : undefined,
    status: ['draft', 'approved', 'in_progress', 'in_progress', 'completed', 'completed', 'in_progress', 'draft', 'approved', 'cancelled'][i],
  }))

  return (
    <div className="space-y-4">
      <Card
        className="shadow-sm"
        bordered={false}
        title="审计计划列表"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              新增计划
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
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  )
}

export default AuditPlans
