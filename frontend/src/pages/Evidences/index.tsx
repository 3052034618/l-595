import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Tag, Upload, Input, Select, DatePicker, Popconfirm, message, Modal } from 'antd'
import { PlusOutlined, UploadOutlined, DownloadOutlined, EyeOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { getStatusColor, getStatusText, formatFileSize, formatDateTime } from '@/utils'
import { getEvidences, uploadEvidence, exportPackage, deleteEvidence } from '@/services/evidences'
import type { TablePaginationConfig } from 'antd/es/table'
import type { UploadProps } from 'antd'

const { RangePicker } = DatePicker
const { Option } = Select

interface EvidenceItem {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  fileType: string
  filePath: string
  fileUrl: string
  auditObjectId?: string
  auditPlanId?: string
  description?: string
  tags?: string[]
  uploadedBy?: string
  validationStatus: string
  validationMessage?: string
  uploadedAt: string
  auditObject?: { id: string; name: string }
  auditPlan?: { id: string; name: string }
  uploadedByUser?: { id: string; name: string }
}

const getEvidenceType = (mimeType: string): string => {
  if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('document')) return 'document'
  if (mimeType.includes('image')) return 'screenshot'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || mimeType.includes('sheet')) return 'spreadsheet'
  if (mimeType.includes('email')) return 'email'
  if (mimeType.includes('audio') || mimeType.includes('video')) return 'interview'
  return 'other'
}

const getEvidenceTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    document: '文档',
    spreadsheet: '表格',
    email: '邮件',
    screenshot: '截图',
    interview: '访谈',
    other: '其他',
  }
  return typeMap[type] || '其他'
}

const mapValidationStatus = (status: string): string => {
  if (status === 'valid') return 'verified'
  if (status === 'invalid') return 'rejected'
  return 'pending'
}

const Evidences: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  useEffect(() => {
    setCurrentPage('/evidences')
  }, [setCurrentPage])

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EvidenceItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [auditObjectId, setAuditObjectId] = useState<string | undefined>()
  const [auditPlanId, setAuditPlanId] = useState<string | undefined>()
  const [fileType, setFileType] = useState<string | undefined>()
  const [uploadedBy, setUploadedBy] = useState<string | undefined>()
  const [dateRange, setDateRange] = useState<[string, string] | null>(null)

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [uploadFormData, setUploadFormData] = useState({
    auditObjectId: '',
    auditPlanId: '',
    description: '',
  })
  const [uploadFileList, setUploadFileList] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page,
        pageSize,
      }
      if (auditObjectId) params.auditObjectId = auditObjectId
      if (auditPlanId) params.auditPlanId = auditPlanId
      if (fileType) params.fileType = fileType
      if (uploadedBy) params.uploadedBy = uploadedBy
      if (dateRange && dateRange[0]) params.startDate = dateRange[0]
      if (dateRange && dateRange[1]) params.endDate = dateRange[1]

      const res = await getEvidences(params)
      if (res.code === 0 && res.data) {
        setData(res.data.items as unknown as EvidenceItem[])
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('获取证据列表失败:', error)
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
    setAuditObjectId(undefined)
    setAuditPlanId(undefined)
    setFileType(undefined)
    setUploadedBy(undefined)
    setDateRange(null)
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await deleteEvidence(id)
      if (res.code === 0) {
        message.success('删除成功')
        fetchData()
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleExport = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要导出的证据')
      return
    }
    try {
      const res = await exportPackage(selectedRowKeys as string[])
      if (res.code === 0 && res.data?.downloadUrl) {
        window.open('http://localhost:3001' + res.data.downloadUrl, '_blank')
        message.success('导出成功')
      }
    } catch (error) {
      console.error('导出失败:', error)
    }
  }

  const handleUpload = async () => {
    if (uploadFileList.length === 0) {
      message.warning('请先选择文件')
      return
    }
    setUploading(true)
    try {
      for (const file of uploadFileList) {
        await uploadEvidence(file, uploadFormData)
      }
      message.success('上传成功')
      setUploadModalOpen(false)
      setUploadFileList([])
      setUploadFormData({ auditObjectId: '', auditPlanId: '', description: '' })
      fetchData()
    } catch (error) {
      console.error('上传失败:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) setPage(pagination.current)
    if (pagination.pageSize) {
      setPageSize(pagination.pageSize)
      setPage(1)
    }
  }

  const customUploadProps: UploadProps = {
    multiple: true,
    beforeUpload: (file) => {
      setUploadFileList((prev) => [...prev, file])
      return false
    },
    onRemove: (file) => {
      setUploadFileList((prev) => prev.filter((f) => f.name !== file.name))
    },
    fileList: uploadFileList.map((f) => ({ uid: f.name, name: f.name, size: f.size })),
  }

  const columns = [
    {
      title: '标题',
      key: 'title',
      render: (_: unknown, record: EvidenceItem) => record.originalName,
    },
    {
      title: '类型',
      key: 'type',
      width: 100,
      render: (_: unknown, record: EvidenceItem) => getEvidenceTypeName(getEvidenceType(record.fileType)),
    },
    {
      title: '文件类型',
      dataIndex: 'fileType',
      key: 'fileType',
      width: 140,
      ellipsis: true,
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      width: 100,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '关联审计计划',
      key: 'auditPlan',
      width: 180,
      render: (_: unknown, record: EvidenceItem) => record.auditPlan?.name || '-',
    },
    {
      title: '上传人',
      key: 'uploadedBy',
      width: 100,
      render: (_: unknown, record: EvidenceItem) => record.uploadedByUser?.name || '-',
    },
    {
      title: '上传时间',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: unknown, record: EvidenceItem) => {
        const displayStatus = mapValidationStatus(record.validationStatus)
        return (
          <Tag color={getStatusColor(displayStatus)}>{getStatusText(displayStatus)}</Tag>
        )
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, record: EvidenceItem) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => window.open('http://localhost:3001' + record.fileUrl, '_blank')}
          >
            预览
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => window.open('http://localhost:3001' + record.fileUrl, '_blank')}
          >
            下载
          </Button>
          <Popconfirm
            title="确定删除该证据？"
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
            <div className="text-sm text-gray-500 mb-1">审计对象ID</div>
            <Input
              placeholder="请输入审计对象ID"
              style={{ width: 180 }}
              value={auditObjectId}
              onChange={(e) => setAuditObjectId(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">审计计划ID</div>
            <Input
              placeholder="请输入审计计划ID"
              style={{ width: 180 }}
              value={auditPlanId}
              onChange={(e) => setAuditPlanId(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">文件类型</div>
            <Select
              placeholder="请选择"
              style={{ width: 150 }}
              allowClear
              value={fileType}
              onChange={(val) => setFileType(val)}
            >
              <Option value="document">文档</Option>
              <Option value="spreadsheet">表格</Option>
              <Option value="screenshot">截图</Option>
              <Option value="other">其他</Option>
            </Select>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">上传人ID</div>
            <Input
              placeholder="请输入上传人ID"
              style={{ width: 150 }}
              value={uploadedBy}
              onChange={(e) => setUploadedBy(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">上传时间</div>
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
        title="证据管理列表"
        extra={
          <Space>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExport}
              disabled={selectedRowKeys.length === 0}
            >
              导出选中({selectedRowKeys.length})
            </Button>
            <Upload {...customUploadProps}>
              <Button icon={<UploadOutlined />}>批量上传</Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadModalOpen(true)}>
              上传证据
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
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
        title="上传证据"
        open={uploadModalOpen}
        onOk={handleUpload}
        onCancel={() => {
          setUploadModalOpen(false)
          setUploadFileList([])
          setUploadFormData({ auditObjectId: '', auditPlanId: '', description: '' })
        }}
        confirmLoading={uploading}
        okText="上传"
        cancelText="取消"
      >
        <div className="space-y-4">
          <Upload {...customUploadProps}>
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          <div>
            <div className="text-sm text-gray-500 mb-1">审计对象ID</div>
            <Input
              placeholder="请输入审计对象ID"
              value={uploadFormData.auditObjectId}
              onChange={(e) => setUploadFormData({ ...uploadFormData, auditObjectId: e.target.value })}
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">审计计划ID</div>
            <Input
              placeholder="请输入审计计划ID"
              value={uploadFormData.auditPlanId}
              onChange={(e) => setUploadFormData({ ...uploadFormData, auditPlanId: e.target.value })}
            />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">描述</div>
            <Input.TextArea
              placeholder="请输入描述"
              rows={3}
              value={uploadFormData.description}
              onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Evidences
