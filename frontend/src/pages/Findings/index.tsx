import React from 'react'
import { Card, Table, Button, Space, Tag } from 'antd'
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { getRiskLevelColor, getRiskLevelText, getStatusColor, getStatusText, formatDate } from '@/utils'

const Findings: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  React.useEffect(() => {
    setCurrentPage('/findings')
  }, [setCurrentPage])

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
      title: '审计对象',
      dataIndex: 'auditObjectName',
      key: 'auditObjectName',
      width: 120,
    },
    {
      title: '关联审计计划',
      dataIndex: 'auditPlanName',
      key: 'auditPlanName',
      width: 180,
    },
    {
      title: '报告人',
      dataIndex: 'reportedBy',
      key: 'reportedBy',
      width: 100,
    },
    {
      title: '报告日期',
      dataIndex: 'reportedAt',
      key: 'reportedAt',
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
      width: 200,
      fixed: 'right' as const,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small">
            查看
          </Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />}>
              确认
            </Button>
          )}
          {record.status === 'rectifying' && (
            <Button type="link" size="small" icon={<CloseCircleOutlined />}>
              关闭
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
    title: [
      '财务报表编制流程存在内控缺陷',
      '系统管理员权限未定期审查',
      '采购合同审批流程不规范',
      '员工考勤制度执行不到位',
      '销售合同条款存在法律风险',
      '生产成本核算方法不一致',
      '研发项目文档管理不完善',
      '费用报销审批权限不清晰',
      '合同归档管理不规范',
      '内部控制评价覆盖不全面',
    ][i],
    description: '详细描述问题...',
    auditObjectId: `AO${String(i + 1).padStart(4, '0')}`,
    auditObjectName: ['财务部', 'IT部门', '采购部', '人力资源部', '销售部', '生产部', '研发部', '行政部', '法务部', '审计部'][i],
    auditPlanId: `AP${String(i + 1).padStart(4, '0')}`,
    auditPlanName: ['2024年度财务审计', '信息系统安全审计', '采购流程合规审计', '人力资源管理审计', '销售合同专项审计', '生产成本核算审计', '研发项目管理审计', '行政管理费用审计', '合同管理制度审计', '内部控制评价审计'][i],
    riskLevel: ['high', 'critical', 'medium', 'low', 'high', 'medium', 'medium', 'low', 'high', 'critical'][i],
    status: ['confirmed', 'rectifying', 'confirmed', 'rectifying', 'closed', 'verified', 'rectifying', 'confirmed', 'rectifying', 'draft'][i],
    reportedBy: ['审计员A', '审计员B', '审计员C', '审计员A', '审计员B', '审计员C', '审计员A', '审计员B', '审计员C', '审计员A'][i],
    reportedAt: `2024-0${Math.floor(i / 3) + 1}-${15 + i}`,
  }))

  return (
    <div className="space-y-4">
      <Card
        className="shadow-sm"
        bordered={false}
        title="审计发现列表"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              新增发现
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

export default Findings
