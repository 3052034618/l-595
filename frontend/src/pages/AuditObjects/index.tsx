import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Tag, Input, Select, Popconfirm, message } from 'antd'
import { PlusOutlined, SearchOutlined, DownloadOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { getStatusColor, getStatusText, getRiskLevelColor, getRiskLevelText, formatDate } from '@/utils'
import { getAuditObjects, deleteAuditObject } from '@/services/auditObjects'
import type { TablePaginationConfig } from 'antd/es/table'

const { Option } = Select

interface AuditObjectItem {
  id: string
  name: string
  code: string
  type: string
  industry?: string
  description?: string
  riskScore: number
  riskLevel: string
  lastAssessmentAt?: string
  contactPerson?: string
  contactPhone?: string
  status: string
  createdAt: string
  updatedAt: string
}

const AuditObjects: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  useEffect(() => {
    setCurrentPage('/audit-objects')
  }, [setCurrentPage])

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AuditObjectItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const [keyword, setKeyword] = useState('')
  const [riskLevel, setRiskLevel] = useState<string | undefined>()
  const [industry, setIndustry] = useState<string | undefined>()
  const [status, setStatus] = useState<string | undefined>()

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        pageSize,
      }
      if (keyword) params.keyword = keyword
      if (riskLevel) params.riskLevel = riskLevel
      if (industry) params.industry = industry
      if (status) params.status = status

      const res = await getAuditObjects(params)
      if (res.code === 0 && res.data) {
        setData(res.data.items as unknown as AuditObjectItem[])
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('获取审计对象列表失败:', error)
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
    setKeyword('')
    setRiskLevel(undefined)
    setIndustry(undefined)
    setStatus(undefined)
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteAuditObject(id)
      if (res.code === 0) {
        message.success('删除成功')
        fetchData()
      }
    } catch (error) {
      console.error('删除失败:', error)
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
          subsidiary: '子公司',
          project: '项目',
          system: '系统',
          process: '流程',
          other: '其他',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '所属部门/行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 140,
      render: (val: string) => val || '-',
    },
    {
      title: '负责人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 100,
      render: (val: string) => val || '-',
    },
    {
      title: '风险分数',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 90,
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
      render: (s: string) => (
        <Tag color={getStatusColor(s)}>{getStatusText(s)}</Tag>
      ),
    },
    {
      title: '上次审计',
      dataIndex: 'lastAssessmentAt',
      key: 'lastAssessmentAt',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: AuditObjectItem) => (
        <Space>
          <Button type="link" size="small">
            查看
          </Button>
          <Button type="link" size="small">
            编辑
          </Button>
          <Popconfirm
            title="确定删除该审计对象？"
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
            <div className="text-sm text-gray-500 mb-1">关键词</div>
            <Input
              placeholder="请输入名称/编码"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">风险等级</div>
            <Select
              placeholder="请选择"
              style={{ width: 150 }}
              allowClear
              value={riskLevel}
              onChange={(val) => setRiskLevel(val)}
            >
              <Option value="low">低风险</Option>
              <Option value="medium">中风险</Option>
              <Option value="high">高风险</Option>
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">所属行业</div>
            <Input
              placeholder="请输入行业"
              style={{ width: 150 }}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
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
              <Option value="active">正常</Option>
              <Option value="inactive">停用</Option>
            </Select>
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
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  )
}

export default AuditObjects
