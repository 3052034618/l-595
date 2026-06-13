import React from 'react'
import { Card, Table, Button, Space, Tag, Upload } from 'antd'
import { PlusOutlined, UploadOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { useAppStore } from '@/store/appStore'
import { getStatusColor, getStatusText, formatFileSize, formatDateTime } from '@/utils'
import type { UploadProps } from 'antd'

const Evidences: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  React.useEffect(() => {
    setCurrentPage('/evidences')
  }, [setCurrentPage])

  const uploadProps: UploadProps = {
    action: '/api/evidences/upload',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('audit_platform_token')}`,
    },
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          document: '文档',
          spreadsheet: '表格',
          email: '邮件',
          screenshot: '截图',
          interview: '访谈',
          other: '其他',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '文件类型',
      dataIndex: 'fileType',
      key: 'fileType',
      width: 100,
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
      dataIndex: 'auditPlanName',
      key: 'auditPlanName',
      width: 180,
    },
    {
      title: '上传人',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
      width: 100,
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
          <Button type="link" size="small" icon={<EyeOutlined />}>
            预览
          </Button>
          <Button type="link" size="small" icon={<DownloadOutlined />}>
            下载
          </Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" danger>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const data = Array.from({ length: 10 }, (_, i) => ({
    key: i + 1,
    title: [
      '财务报表2024Q1.xlsx',
      '系统权限清单.pdf',
      '采购合同扫描件.pdf',
      '员工手册.docx',
      '销售合同模板.docx',
      '生产成本核算表.xlsx',
      '项目进度报告.pptx',
      '费用报销制度.pdf',
      '合同管理制度.docx',
      '内部控制矩阵.xlsx',
    ][i],
    type: ['spreadsheet', 'document', 'document', 'document', 'document', 'spreadsheet', 'other', 'document', 'document', 'spreadsheet'][i],
    fileType: ['XLSX', 'PDF', 'PDF', 'DOCX', 'DOCX', 'XLSX', 'PPTX', 'PDF', 'DOCX', 'XLSX'][i],
    fileSize: [1024000, 2048000, 512000, 256000, 768000, 1536000, 3072000, 128000, 384000, 2048000][i],
    auditPlanId: `AP${String(i + 1).padStart(4, '0')}`,
    auditPlanName: ['2024年度财务审计', '信息系统安全审计', '采购流程合规审计', '人力资源管理审计', '销售合同专项审计', '生产成本核算审计', '研发项目管理审计', '行政管理费用审计', '合同管理制度审计', '内部控制评价审计'][i],
    uploadedBy: ['审计员A', '审计员B', '审计员C', '审计员A', '审计员B', '审计员C', '审计员A', '审计员B', '审计员C', '审计员A'][i],
    uploadedAt: `2024-0${Math.floor(i / 3) + 1}-${10 + i} 14:${30 + i}:00`,
    hash: `SHA256:${Math.random().toString(36).substring(2, 10)}...`,
    status: ['verified', 'verified', 'pending', 'verified', 'rejected', 'verified', 'pending', 'verified', 'verified', 'pending'][i],
  }))

  return (
    <div className="space-y-4">
      <Card
        className="shadow-sm"
        bordered={false}
        title="证据管理列表"
        extra={
          <Space>
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>批量上传</Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />}>
              上传证据
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

export default Evidences
