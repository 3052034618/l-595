import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

const { Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const { collapsed } = useAppStore()

  return (
    <Layout className="h-screen">
      <Sider
        width={240}
        collapsed={collapsed}
        collapsedWidth={80}
        trigger={null}
        style={{
          background: '#1e3a5f',
        }}
      >
        <Sidebar />
      </Sider>
      <Layout className="flex flex-col">
        <Header />
        <Content
          className="overflow-auto p-6 bg-gray-50"
          style={{
            height: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
