import React from 'react'
import { Card, Table, Button, Space, Tag, Input, Select, DatePicker } from 'antd'
import { PlusOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { getStatusColor, getStatusText, getRiskLevelColor, getRiskLevelText } from '@/utils'

const { RangePicker } = DatePicker
const { Option } = Select

const AuditObjects: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  React.useEffect(() => {
    setCurrentPage('/audit-objects')
  }, [setCurrentPage])

  const columns = [
    {
      title: '对象编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '对象名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          department: '部门',
          project: '项目',
          system: '系统',
          process: '流程',
          other: '其他',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '所属部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
    },
    {
      title: '负责人',
      dataIndex: 'manager',
      key: 'manager',
      width: 100,
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '上次审计',
      dataIndex: 'lastAuditDate',
      key: 'lastAuditDate',
      width: 120,
    },
    {
      title: '下次审计',
      dataIndex: 'nextAuditDate',
      key: 'nextAuditDate',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: () => (
        <Space>
          <Button type="link" size="small">
            查看
          </Button>
          <Button type="link" size="small">
            编辑
          </Button>
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const data = Array.from({ length: 10 }, (_, i) => ({
    key: i + 1,
    code: `AO${String(i + 1).padStart(4, '0')}`,
    name: ['财务部', 'IT部门', '采购部', '人力资源部', '销售部', '生产部', '研发部', '行政部', '法务部', '审计部'][i],
    type: ['department', 'department', 'department', 'department', 'department', 'department', 'department', 'department', 'department', 'department'][i],
    department: ['集团总部', '集团总部', '集团总部', '集团总部', '集团总部', '分子公司', '分子公司', '集团总部', '集团总部', '集团总部'][i],
    manager: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二'][i],
    riskLevel: ['low', 'medium', 'high', 'critical', 'low', 'medium', 'high', 'low', 'medium', 'low'][i],
    status: ['active', 'active', 'active', 'inactive', 'active', 'active', 'active', 'archived', 'active', 'active'][i],
    lastAuditDate: `2024-0${i + 1}-15`,
    nextAuditDate: `2024-0${i + 1}-15`,
  }))

  return (
    <div className="space-y-4">
      <Card className="shadow-sm" bordered={false}>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <div className="text-sm text-gray-500 mb-1">关键词</div>
            <Input placeholder="请输入名称/编码" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">类型</div>
            <Select placeholder="请选择" style={{ width: 150 }} allowClear>
              <Option value="department">部门</Option>
              <Option value="project">项目</Option>
              <Option value="system">系统</Option>
              <Option value="process">流程</Option>
              <Option value="other">其他</Option>
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">风险等级</div>
            <Select placeholder="请选择" style={{ width: 150 }} allowClear>
              <Option value="low">低风险</Option>
              <Option value="medium">中风险</Option>
              <Option value="high">高风险</Option>
              <Option value="critical">极高风险</Option>
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">状态</div>
            <Select placeholder="请选择" style={{ width: 150 }} allowClear>
              <Option value="active">正常</Option>
              <Option value="inactive">停用</Option>
              <Option value="archived">已归档</Option>
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">创建时间</div>
            <RangePicker />
          </div>
          <Space>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button>重置</Button>
          </Space>
        </div>
      </Card>

      <Card
        className="shadow-sm"
        bordered={false}
        title="审计对象列表"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />}>导出</Button>
            <Button type="primary" icon={<PlusOutlined />}>
              新增
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

export default AuditObjects
