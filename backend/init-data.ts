import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始初始化数据...');

  const passwordHash = await bcrypt.hash('123456', 10);

  const users = [
    {
      username: 'admin',
      passwordHash,
      name: '系统管理员',
      email: 'admin@example.com',
      phone: '13800138000',
      role: 'admin',
      department: '信息部',
    },
    {
      username: 'audit_manager',
      passwordHash,
      name: '审计经理',
      email: 'manager@example.com',
      phone: '13800138001',
      role: 'audit_manager',
      department: '审计部',
    },
    {
      username: 'auditor1',
      passwordHash,
      name: '审计员张三',
      email: 'auditor1@example.com',
      phone: '13800138002',
      role: 'auditor',
      department: '审计部',
    },
    {
      username: 'auditor2',
      passwordHash,
      name: '审计员李四',
      email: 'auditor2@example.com',
      phone: '13800138003',
      role: 'auditor',
      department: '审计部',
    },
    {
      username: 'dept_head',
      passwordHash,
      name: '部门负责人王五',
      email: 'dept@example.com',
      phone: '13800138004',
      role: 'department_head',
      department: '财务部',
    },
    {
      username: 'executive',
      passwordHash,
      name: '高管赵六',
      email: 'exec@example.com',
      phone: '13800138005',
      role: 'executive',
      department: '管理层',
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user,
    });
    console.log(`用户 ${user.username} 创建/已存在`);
  }

  const riskModels = [
    {
      dimensionCode: 'financial',
      dimensionName: '财务风险',
      weight: 0.25,
      factors: [
        { code: 'debt_ratio', name: '资产负债率', weight: 0.4, dataSource: 'financial_system', rule: 'value > 70 ? 100 : value > 50 ? 70 : value > 30 ? 40 : 10' },
        { code: 'cash_flow', name: '现金流状况', weight: 0.3, dataSource: 'financial_system', rule: 'value < 0 ? 100 : value < 1000000 ? 70 : value < 5000000 ? 40 : 10' },
        { code: 'profit_margin', name: '利润率异常', weight: 0.3, dataSource: 'financial_system', rule: 'value < 0 ? 100 : value < 2 ? 70 : value < 5 ? 40 : 10' },
      ],
    },
    {
      dimensionCode: 'operational',
      dimensionName: '运营风险',
      weight: 0.25,
      factors: [
        { code: 'contract_risk', name: '合同风险', weight: 0.4, dataSource: 'contract_system', rule: 'count > 10 ? 100 : count > 5 ? 70 : count > 2 ? 40 : 10' },
        { code: 'procurement_risk', name: '采购风险', weight: 0.3, dataSource: 'procurement_system', rule: 'anomaly_count > 5 ? 100 : anomaly_count > 2 ? 70 : anomaly_count > 0 ? 40 : 10' },
        { code: 'process_efficiency', name: '流程效率', weight: 0.3, dataSource: 'multiple', rule: 'avg_days > 30 ? 100 : avg_days > 15 ? 70 : avg_days > 7 ? 40 : 10' },
      ],
    },
    {
      dimensionCode: 'compliance',
      dimensionName: '合规风险',
      weight: 0.20,
      factors: [
        { code: 'violation_count', name: '违规次数', weight: 0.5, dataSource: 'multiple', rule: 'count > 3 ? 100 : count > 1 ? 70 : count > 0 ? 40 : 10' },
        { code: 'audit_findings', name: '历史审计发现', weight: 0.5, dataSource: 'internal', rule: 'count > 5 ? 100 : count > 2 ? 70 : count > 0 ? 40 : 10' },
      ],
    },
    {
      dimensionCode: 'strategic',
      dimensionName: '战略风险',
      weight: 0.15,
      factors: [
        { code: 'strategic_alignment', name: '战略一致性', weight: 0.6, dataSource: 'manual', rule: 'low ? 100 : medium ? 50 : 20' },
        { code: 'market_position', name: '市场地位', weight: 0.4, dataSource: 'external', rule: 'decline > 20 ? 100 : decline > 10 ? 70 : decline > 0 ? 40 : 10' },
      ],
    },
    {
      dimensionCode: 'reputational',
      dimensionName: '声誉风险',
      weight: 0.15,
      factors: [
        { code: 'negative_news', name: '负面舆情', weight: 0.5, dataSource: 'external', rule: 'count > 5 ? 100 : count > 2 ? 70 : count > 0 ? 40 : 10' },
        { code: 'customer_complaints', name: '客户投诉', weight: 0.5, dataSource: 'crm', rule: 'count > 10 ? 100 : count > 5 ? 70 : count > 0 ? 40 : 10' },
      ],
    },
  ];

  for (const model of riskModels) {
    await prisma.riskModel.upsert({
      where: { dimensionCode: model.dimensionCode },
      update: {},
      create: {
        ...model,
        factors: JSON.stringify(model.factors),
      },
    });
    console.log(`风险模型 ${model.dimensionName} 创建/已存在`);
  }

  console.log('数据初始化完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
