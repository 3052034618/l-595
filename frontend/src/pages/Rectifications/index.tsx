import React from 'react'
import { Card, Table, Button, Space, Tag, Progress } from 'antd'
import { PlusOutlined, CheckCircleOutlined, MessageOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { getStatusColor, getStatusText, formatDate } from '@/utils'

const Rectifications: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  React.useEffect(() => {
    setCurrentPage('/rectifications')
  }, [setCurrentPage])

  const columns = [
    {
      title: '整改描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '关联发现',
      dataIndex: 'findingTitle',
      key: 'findingTitle',
      width: 200,
      ellipsis: true,
    },
    {
      title: '责任部门',
      dataIndex: 'responsibleDepartment',
      key: 'responsibleDepartment',
      width: 120,
    },
    {
      title: '责任人',
      dataIndex: 'responsiblePerson',
      key: 'responsiblePerson',
      width: 100,
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number, record) => (
        <Progress
          percent={progress}
          status={
            record.status === 'verified'
              ? 'success'
              : record.status === 'rejected'
              ? 'exception'
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
          <Button type="link" size="small" icon={<MessageOutlined />}>
            评论
          </Button>
          {record.status === 'in_progress' && (
            <Button type="link" size="small">
              更新进度
            </Button>
          )}
          {record.status === 'submitted' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />}>
              验证
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const data = Array.from({ length: 10 }, (_, i) => ({
    key: i + 1,
    findingId: `F${String(i + 1).padStart(4, '0')}`,
    findingTitle: [
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
    auditPlanName: ['2024年度财务审计', '信息系统安全审计', '采购流程合规审计', '人力资源管理审计', '销售合同专项审计', '生产成本核算审计', '研发项目管理审计', '行政管理费用审计', '合同管理制度审计', '内部控制评价审计'][i],
    description: [
      '完善财务报表编制流程，增加复核环节',
      '每季度审查系统管理员权限，移除不必要权限',
      '规范采购合同审批流程，严格执行三级审批',
      '加强员工考勤监督，引入人脸识别系统',
      '修订销售合同模板，增加法律审查环节',
      '统一生产成本核算方法，制定操作手册',
      '完善研发项目文档管理制度',
      '明确费用报销审批权限，制定权限矩阵',
      '规范合同归档管理，建立电子档案系统',
      '扩大内部控制评价覆盖范围',
    ][i],
    responsibleDepartment: ['财务部', 'IT部门', '采购部', '人力资源部', '销售部', '生产部', '研发部', '行政部', '法务部', '审计部'][i],
    responsiblePerson: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二'][i],
    deadline: `2024-0${Math.floor(i / 2) + 2}-28`,
    progress: [100, 60, 80, 40, 100, 70, 30, 90, 50, 20][i],
    status: ['verified', 'in_progress', 'submitted', 'in_progress', 'verified', 'in_progress', 'in_progress', 'submitted', 'in_progress', 'pending'][i],
    measures: '具体整改措施...',
  }))

  return (
    <div className="space-y-4">
      <Card
        className="shadow-sm"
        bordered={false}
        title="整改跟踪列表"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              新增整改
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

export default Rectifications
