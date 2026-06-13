import dayjs from 'dayjs'

export const formatDate = (date: string | Date | undefined, format: string = 'YYYY-MM-DD'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatDateTime = (date: string | Date | undefined, format: string = 'YYYY-MM-DD HH:mm:ss'): string => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const getRiskLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    low: '#52c41a',
    medium: '#faad14',
    high: '#fa8c16',
    critical: '#f5222d',
  }
  return colors[level] || '#8c8c8c'
}

export const getRiskLevelText = (level: string): string => {
  const texts: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '极高风险',
  }
  return texts[level] || '未知'
}

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: '#8c8c8c',
    submitted: '#1890ff',
    approved: '#52c41a',
    rejected: '#f5222d',
    active: '#52c41a',
    inactive: '#8c8c8c',
    archived: '#8c8c8c',
    in_progress: '#1890ff',
    completed: '#52c41a',
    cancelled: '#f5222d',
    pending: '#faad14',
    verified: '#52c41a',
    confirmed: '#1890ff',
    rectifying: '#faad14',
    closed: '#52c41a',
    reviewing: '#1890ff',
    issued: '#52c41a',
  }
  return colors[status] || '#8c8c8c'
}

export const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    draft: '草稿',
    submitted: '已提交',
    approved: '已批准',
    rejected: '已拒绝',
    active: '正常',
    inactive: '停用',
    archived: '已归档',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    pending: '待处理',
    verified: '已验证',
    confirmed: '已确认',
    rectifying: '整改中',
    closed: '已关闭',
    reviewing: '审核中',
    issued: '已发布',
  }
  return texts[status] || '未知'
}

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
