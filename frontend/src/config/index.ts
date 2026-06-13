export interface AppConfig {
  apiBaseUrl: string
  tokenKey: string
  title: string
}

const config: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  tokenKey: 'audit_platform_token',
  title: '内部审计管理系统',
}

export default config
