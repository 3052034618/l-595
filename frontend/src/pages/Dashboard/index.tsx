import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Progress, Tag, Spin, Empty } from 'antd'
import {
  FileTextOutlined,
  SearchOutlined,
  AlertOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useAppStore } from '@/store/appStore'
import { getRiskLevelColor, getRiskLevelText, formatDateTime } from '@/utils'
import { getDashboardStats } from '@/services/reports'
import { getRiskAssessments } from '@/services/riskAssessment'
import type { ApiResponse } from '@/types'

interface DashboardStats {
  overview: {
    totalAuditObjects: number
    activeAuditPlans: number
    pendingFindings: number
    inProgressRectifications: number
  }
  findingsByRiskLevel: {
    high: number
    medium: number
    low: number
  }
  recentAssessments: Array<{
    id: string
    auditObjectName: string
    currentLevel: string
    currentScore: number
    assessedAt: string
  }>
}

const Dashboard: React.FC = () => {
  const { setCurrentPage } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  React.useEffect(() => {
    setCurrentPage('/dashboard')
  }, [setCurrentPage])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = (await getDashboardStats()) as ApiResponse<DashboardStats>
      if (res.code === 0) {
        setStats(res.data)
      }
    } catch (error) {
      console.error('Fetch dashboard stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const totalFindings = stats
    ? stats.findingsByRiskLevel.high + stats.findingsByRiskLevel.medium + stats.findingsByRiskLevel.low
    : 0

  const riskDistributionOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '风险分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold' },
        },
        labelLine: { show: false },
        data: stats
          ? [
              { value: stats.findingsByRiskLevel.high, name: '高风险', itemStyle: { color: '#f5222d' } },
              { value: stats.findingsByRiskLevel.medium, name: '中风险', itemStyle: { color: '#faad14' } },
              { value: stats.findingsByRiskLevel.low, name: '低风险', itemStyle: { color: '#52c41a' } },
            ]
          : [],
      },
    ],
  }

  const auditTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增评估', '高风险对象'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: stats?.recentAssessments
        ? stats.recentAssessments.map((a) => formatDateTime(a.assessedAt).slice(5, 10)).reverse()
        : [],
    },
    yAxis: { type: 'value' },
    series: stats
      ? [
          {
            name: '风险分数',
            type: 'line',
            data: stats.recentAssessments.map((a) => a.currentScore).reverse(),
            smooth: true,
            itemStyle: { color: '#1e3a5f' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(30,58,95,0.3)' },
                  { offset: 1, color: 'rgba(30,58,95,0.05)' },
                ],
              },
            },
          },
          {
            name: '高风险标记',
            type: 'scatter',
            data: stats.recentAssessments
              .map((a) => (a.currentLevel === 'high' ? a.currentScore : null))
              .reverse(),
            symbolSize: 15,
            itemStyle: { color: '#f5222d' },
          },
        ]
      : [],
  }

  const rectificationProgress = stats?.recentAssessments
    ? stats.recentAssessments.slice(0, 4).map((a) => ({
        name: a.auditObjectName,
        progress: Math.max(a.currentScore, 5),
        status: a.currentLevel,
      }))
    : []

  const recentActivities = [
    {
      icon: <CheckCircleOutlined className="text-green-500" />,
      title: stats
        ? `审计对象总数: ${stats.overview.totalAuditObjects} 个`
        : '数据加载中...',
      time: '全部活跃对象',
    },
    {
      icon: <AlertOutlined className="text-orange-500" />,
      title: stats
        ? `进行中的审计计划: ${stats.overview.activeAuditPlans} 项`
        : '数据加载中...',
      time: '最近30天',
    },
    {
      icon: <SearchOutlined className="text-blue-500" />,
      title: stats ? `待处理审计发现: ${stats.overview.pendingFindings} 项` : '数据加载中...',
      time: '需要立即关注',
    },
    {
      icon: <ToolOutlined className="text-purple-500" />,
      title: stats
        ? `整改中任务: ${stats.overview.inProgressRectifications} 项`
        : '数据加载中...',
      time: '跟踪处理中',
    },
    {
      icon: <TeamOutlined className="text-cyan-500" />,
      title: stats ? `最近风险评估: ${stats.recentAssessments?.length || 0} 次` : '数据加载中...',
      time: '最新记录',
    },
  ]

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="加载仪表盘数据..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
        <div className="text-sm text-gray-500">
          数据更新时间: {new Date().toLocaleString('zh-CN')}
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="审计对象总数"
              value={stats?.overview.totalAuditObjects || 0}
              prefix={<FileTextOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1e3a5f' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              状态: <span className="text-green-500">正常运行</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃审计计划"
              value={stats?.overview.activeAuditPlans || 0}
              prefix={<SearchOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              待处理发现 <span className="text-orange-500">{stats?.overview.pendingFindings || 0}</span> 项
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="发现问题总数"
              value={totalFindings}
              prefix={<AlertOutlined className="text-red-500" />}
              valueStyle={{ color: '#f5222d' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              高风险 <span className="text-red-500">{stats?.findingsByRiskLevel.high || 0}</span> 项
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="整改跟踪"
              value={stats?.overview.inProgressRectifications || 0}
              prefix={<ToolOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              整改处理中任务
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="风险等级分布" extra={<a href="/risk-assessment">查看详情</a>}>
            {totalFindings > 0 ? (
              <ReactECharts option={riskDistributionOption} style={{ height: 300 }} />
            ) : (
              <Empty description="暂无风险分布数据" style={{ marginTop: 60 }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="近期风险评估趋势" extra={<a href="/risk-assessment">查看详情</a>}>
            {stats?.recentAssessments && stats.recentAssessments.length > 0 ? (
              <ReactECharts option={auditTrendOption} style={{ height: 300 }} />
            ) : (
              <Empty description="暂无风险评估数据" style={{ marginTop: 60 }} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="被审计对象风险状况" extra={<a href="/rectifications">查看整改</a>}>
            {rectificationProgress && rectificationProgress.length > 0 ? (
              <div className="space-y-4">
                {rectificationProgress.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{item.name}</span>
                      <Tag color={getRiskLevelColor(item.status)}>
                        {getRiskLevelText(item.status)}
                      </Tag>
                    </div>
                    <Progress
                      percent={item.progress}
                      status={
                        item.progress >= 80
                          ? 'success'
                          : item.status === 'high'
                          ? 'exception'
                          : 'active'
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Empty description="暂无风险评估记录" style={{ marginTop: 60 }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="系统概览">
            <div className="space-y-4">
              {recentActivities.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0"
                >
                  <div className="text-xl">{item.icon}</div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-xs text-gray-400">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
