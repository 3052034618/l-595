import React from 'react'
import { Card, Row, Col, Statistic, Progress, Tag } from 'antd'
import {
  FileTextOutlined,
  SearchOutlined,
  AlertOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useAppStore } from '@/store/appStore'
import { getRiskLevelColor, getRiskLevelText } from '@/utils'

const Dashboard: React.FC = () => {
  const { setCurrentPage } = useAppStore()

  React.useEffect(() => {
    setCurrentPage('/dashboard')
  }, [setCurrentPage])

  const riskDistributionOption = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
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
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: 5, name: '极高风险', itemStyle: { color: '#f5222d' } },
          { value: 12, name: '高风险', itemStyle: { color: '#fa8c16' } },
          { value: 25, name: '中风险', itemStyle: { color: '#faad14' } },
          { value: 58, name: '低风险', itemStyle: { color: '#52c41a' } },
        ],
      },
    ],
  }

  const auditTrendOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['审计计划', '发现问题', '已完成整改'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '审计计划',
        type: 'line',
        data: [12, 15, 18, 14, 20, 16],
        smooth: true,
        itemStyle: { color: '#1e3a5f' },
      },
      {
        name: '发现问题',
        type: 'line',
        data: [25, 30, 28, 35, 40, 32],
        smooth: true,
        itemStyle: { color: '#fa8c16' },
      },
      {
        name: '已完成整改',
        type: 'line',
        data: [20, 25, 24, 30, 35, 28],
        smooth: true,
        itemStyle: { color: '#52c41a' },
      },
    ],
  }

  const rectificationProgress = [
    { name: '财务审计整改', progress: 85, status: 'high' },
    { name: 'IT系统审计整改', progress: 60, status: 'medium' },
    { name: '采购流程审计整改', progress: 100, status: 'low' },
    { name: '人力资源审计整改', progress: 30, status: 'critical' },
  ]

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
              title="审计对象"
              value={100}
              prefix={<FileTextOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1e3a5f' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              较上月 <span className="text-green-500">+5%</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="审计发现"
              value={130}
              prefix={<SearchOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              待处理 <span className="text-orange-500">32</span> 项
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="风险评估"
              value={17}
              prefix={<AlertOutlined className="text-red-500" />}
              valueStyle={{ color: '#f5222d' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              高风险 <span className="text-red-500">5</span> 项
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="整改完成率"
              value={85}
              suffix="%"
              prefix={<ToolOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="mt-2 text-sm text-gray-500">
              已完成 <span className="text-green-500">28</span> / 33 项
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="风险分布" extra={<a href="/risk-assessment">查看详情</a>}>
            <ReactECharts option={riskDistributionOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="审计趋势" extra={<a href="/audit-plans">查看详情</a>}>
            <ReactECharts option={auditTrendOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="整改进度" extra={<a href="/rectifications">查看详情</a>}>
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
                      item.progress === 100
                        ? 'success'
                        : item.status === 'critical'
                        ? 'exception'
                        : 'active'
                    }
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近活动">
            <div className="space-y-4">
              {[
                {
                  icon: <CheckCircleOutlined className="text-green-500" />,
                  title: '财务审计报告已发布',
                  time: '10分钟前',
                },
                {
                  icon: <AlertOutlined className="text-orange-500" />,
                  title: '新发现高风险问题 3 项',
                  time: '1小时前',
                },
                {
                  icon: <ClockCircleOutlined className="text-blue-500" />,
                  title: 'IT系统审计计划已启动',
                  time: '2小时前',
                },
                {
                  icon: <ToolOutlined className="text-purple-500" />,
                  title: '采购流程整改任务已分配',
                  time: '3小时前',
                },
                {
                  icon: <FileTextOutlined className="text-gray-500" />,
                  title: '新上传审计证据 15 份',
                  time: '5小时前',
                },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0">
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
