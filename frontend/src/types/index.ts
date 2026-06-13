export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface PageParams {
  page?: number
  pageSize?: number
  [key: string]: unknown
}

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: 'admin' | 'auditor' | 'manager' | 'viewer'
  department: string
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface AuditObject {
  id: string
  name: string
  code: string
  type: 'department' | 'project' | 'system' | 'process' | 'other'
  description: string
  department: string
  manager: string
  managerEmail: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'inactive' | 'archived'
  lastAuditDate?: string
  nextAuditDate?: string
  createdAt: string
  updatedAt: string
}

export interface RiskAssessment {
  id: string
  auditObjectId: string
  auditObjectName: string
  assessmentPeriod: string
  inherentRisk: number
  controlEffectiveness: number
  residualRisk: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  assessor: string
  assessmentDate: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface RiskFactor {
  id: string
  name: string
  category: string
  description: string
  likelihood: number
  impact: number
  score: number
}

export interface AuditPlan {
  id: string
  name: string
  code: string
  auditObjectId: string
  auditObjectName: string
  auditType: 'financial' | 'operational' | 'compliance' | 'it' | 'special'
  status: 'draft' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
  planStartDate: string
  planEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  leadAuditor: string
  teamMembers: string[]
  scope: string
  objectives: string
  createdAt: string
  updatedAt: string
}

export interface Evidence {
  id: string
  auditPlanId: string
  auditPlanName: string
  findingId?: string
  title: string
  description: string
  type: 'document' | 'spreadsheet' | 'email' | 'screenshot' | 'interview' | 'other'
  fileType: string
  fileSize: number
  fileUrl: string
  uploadedBy: string
  uploadedAt: string
  hash: string
  status: 'pending' | 'verified' | 'rejected'
}

export interface Finding {
  id: string
  auditPlanId: string
  auditPlanName: string
  auditObjectId: string
  auditObjectName: string
  title: string
  description: string
  criteria: string
  condition: string
  cause: string
  effect: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  status: 'draft' | 'confirmed' | 'rectifying' | 'closed' | 'verified'
  reportedBy: string
  reportedAt: string
  confirmedBy?: string
  confirmedAt?: string
  recommendation: string
  createdAt: string
  updatedAt: string
}

export interface Rectification {
  id: string
  findingId: string
  findingTitle: string
  auditPlanName: string
  description: string
  responsibleDepartment: string
  responsiblePerson: string
  deadline: string
  actualCompletionDate?: string
  status: 'pending' | 'in_progress' | 'submitted' | 'verified' | 'rejected'
  progress: number
  measures: string
  evidenceIds: string[]
  comments: RectificationComment[]
  createdAt: string
  updatedAt: string
}

export interface RectificationComment {
  id: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

export interface Report {
  id: string
  auditPlanId: string
  auditPlanName: string
  title: string
  type: 'interim' | 'final' | 'special'
  status: 'draft' | 'reviewing' | 'approved' | 'issued'
  generatedBy: string
  generatedAt?: string
  approvedBy?: string
  approvedAt?: string
  scope: string
  executiveSummary: string
  findings: string[]
  recommendations: string
  fileUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  recipientId: string
  userId?: string
  title: string
  content: string
  type: 'system' | 'alert' | 'message' | 'task' | 'audit_change'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  relatedId?: string
  relatedType?: string
  isRead: boolean
  createdAt: string
  readAt?: string
}

export interface NotificationPageResult<T> {
  items: T[]
  total: number
  unreadCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SystemLog {
  id: string
  userId: string
  userName: string
  action: string
  module: string
  ipAddress: string
  userAgent: string
  details: string
  createdAt: string
}

export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
}
