import React from 'react'
import { Card, Table, Button, Space, Tag, Input, Select, DatePicker } from 'antd'
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { formatDateTime } from '@/utils'

const { RangePicker } = DatePicker
const { Option } = Select

const SystemLogs: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  React.useEffect(() => {
    setCurrentPage('/system-logs')
  }, [setCurrentPage])

  const columns = [
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '用户名',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 150,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (module: string) => {
        const colorMap: Record<string, string> = {
          认证: 'blue',
          审计对象: 'green',
          风险评估: 'orange',
          审计计划: 'purple',
          证据管理: 'cyan',
          审计发现: 'red',
          整改跟踪: 'gold',
          报告中心: 'geekblue',
          系统设置: 'magenta',
        }
        return <Tag color={colorMap[module] || 'default'}>{module}</Tag>
      },
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
    },
    {
      title: '操作详情',
      dataIndex: 'details',
      key: 'details',
    },
  ]

  const data = Array.from({ length: 15 }, (_, i) => ({
    key: i + 1,
    userId: `U${String(1001 + i).padStart(4, '0')}`,
    userName: ['admin', 'audit_a', 'audit_b', 'manager', 'viewer', 'admin', 'audit_a', 'audit_b', 'manager', 'viewer', 'admin', 'audit_a', 'audit_b', 'manager', 'viewer'][i],
    action: [
      '用户登录',
      '创建审计对象',
      '更新风险评估',
      '审批审计计划',
      '查看审计发现',
      '上传审计证据',
      '确认审计发现',
      '更新整改进度',
      '生成审计报告',
      '导出系统日志',
      '修改密码',
      '删除审计对象',
      '提交风险评估',
      '启动审计计划',
      '下载审计报告',
    ][i],
    module: ['认证', '审计对象', '风险评估', '审计计划', '审计发现', '证据管理', '审计发现', '整改跟踪', '报告中心', '系统设置', '认证', '审计对象', '风险评估', '审计计划', '报告中心'][i],
    ipAddress: `192.168.1.${100 + (i % 50)}`,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: [
      '用户 admin 登录系统',
      '创建审计对象：财务部',
      '更新风险评估：IT部门 2024Q1',
      '审批审计计划：AP0001',
      '查看审计发现：F0001',
      '上传证据：财务报表2024Q1.xlsx',
      '确认审计发现：F0002',
      '更新整改进度至 60%',
      '生成报告：2024年度财务审计报告',
      '导出系统日志 100 条',
      '用户修改登录密码',
      '删除审计对象：测试部门',
      '提交风险评估审批',
      '启动审计计划：AP0003',
      '下载报告：信息系统安全审计报告.pdf',
    ][i],
    createdAt: `2024-0${Math.floor(i / 5) + 1}-${10 + (i % 10)} ${String(8 + (i % 12)).padStart(2, '0')}:${String(30 + i).padStart(2, '0')}:00`,
  }))

  return (
    <div className="space-y-4">
      <Card className="shadow-sm" bordered={false}>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <div className="text-sm text-gray-500 mb-1">用户名</div>
            <Input placeholder="请输入用户名" prefix={<SearchOutlined />} style={{ width: 200 }} />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">模块</div>
            <Select placeholder="请选择" style={{ width: 150 }} allowClear>
              <Option value="auth">认证</Option>
              <Option value="audit-objects">审计对象</Option>
              <Option value="risk-assessment">风险评估</Option>
              <Option value="audit-plans">审计计划</Option>
              <Option value="evidences">证据管理</Option>
              <Option value="findings">审计发现</Option>
              <Option value="rectifications">整改跟踪</Option>
              <Option value="reports">报告中心</Option>
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">操作时间</div>
            <RangePicker showTime />
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
        title="系统日志"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />}>导出</Button>
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

export default SystemLogs
