import { useState } from 'react'
import { Form, Input, Button, Card, message, Spin } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import type { LoginRequest } from '@/types'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loading } = useUserStore()
  const [form] = Form.useForm()

  const onFinish = async (values: LoginRequest) => {
    try {
      await login(values)
      message.success('登录成功')
      const from = (location.state as { from?: Location })?.from?.pathname || '/'
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%)',
      }}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <Card className="w-full max-w-md shadow-2xl relative z-10" bordered={false}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <span className="text-white text-3xl font-bold">审</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">内部审计管理系统</h1>
          <p className="text-gray-500">请登录以继续访问</p>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          disabled={loading}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-12 text-base font-medium"
              loading={loading}
              style={{ background: '#1e3a5f', borderColor: '#1e3a5f' }}
            >
              {loading ? <Spin size="small" /> : '登录'}
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-sm text-gray-500 mt-6">
          <p>默认账号: admin / 密码: admin123</p>
        </div>
      </Card>
    </div>
  )
}

export default Login
