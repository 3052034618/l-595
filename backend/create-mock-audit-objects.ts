import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const auditObjects = [
  {
    name: '财务部',
    code: 'FIN-001',
    type: '部门',
    industry: '金融',
    description: '公司财务管理部门，负责资金管理、财务核算、税务管理等',
    contactPerson: '陈会计',
    contactPhone: '13800000001',
    riskScore: 65.5,
    riskLevel: 'medium',
  },
  {
    name: '采购部',
    code: 'PUR-001',
    type: '部门',
    industry: '供应链',
    description: '公司采购管理部门，负责供应商管理、采购执行等',
    contactPerson: '李采购',
    contactPhone: '13800000002',
    riskScore: 78.3,
    riskLevel: 'high',
  },
  {
    name: '销售部',
    code: 'SAL-001',
    type: '部门',
    industry: '销售',
    description: '公司销售管理部门，负责市场拓展、客户管理等',
    contactPerson: '王销售',
    contactPhone: '13800000003',
    riskScore: 45.2,
    riskLevel: 'medium',
  },
  {
    name: '技术研发部',
    code: 'RND-001',
    type: '部门',
    industry: '技术',
    description: '公司技术研发部门，负责产品开发、技术创新等',
    contactPerson: '张工程师',
    contactPhone: '13800000004',
    riskScore: 32.8,
    riskLevel: 'low',
  },
  {
    name: '人力资源部',
    code: 'HR-001',
    type: '部门',
    industry: '人力',
    description: '公司人力资源管理部门，负责招聘、培训、绩效管理等',
    contactPerson: '刘HR',
    contactPhone: '13800000005',
    riskScore: 28.5,
    riskLevel: 'low',
  },
  {
    name: '子公司A',
    code: 'SUB-001',
    type: '子公司',
    industry: '制造业',
    description: '旗下制造子公司，主要生产精密零部件',
    contactPerson: '赵总',
    contactPhone: '13800000006',
    riskScore: 82.1,
    riskLevel: 'high',
  },
  {
    name: '子公司B',
    code: 'SUB-002',
    type: '子公司',
    industry: '贸易',
    description: '旗下贸易子公司，负责进出口业务',
    contactPerson: '孙总',
    contactPhone: '13800000007',
    riskScore: 71.6,
    riskLevel: 'high',
  },
  {
    name: '运营部',
    code: 'OPS-001',
    type: '部门',
    industry: '运营',
    description: '公司运营管理部门，负责日常运营管理',
    contactPerson: '周运营',
    contactPhone: '13800000008',
    riskScore: 38.9,
    riskLevel: 'low',
  },
];

async function main() {
  console.log('开始创建示例审计对象数据...');

  for (const obj of auditObjects) {
    await prisma.auditObject.upsert({
      where: { code: obj.code },
      update: {},
      create: obj,
    });
    console.log(`审计对象 ${obj.name} (${obj.code}) 创建/已存在`);
  }

  console.log('示例审计对象数据创建完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
