import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

@Injectable()
export class DataCollectionService {
  constructor(private prisma: PrismaService) {}

  async collectFromContractSystem() {
    const batchId = uuidv4();
    const mockData = this.generateMockContractData();

    const collectedData = [];
    for (const data of mockData) {
      const record = await this.prisma.collectedData.create({
        data: {
          sourceSystem: 'contract_system',
          dataType: 'contract',
          rawData: JSON.stringify(data),
          collectionBatch: batchId,
        },
      });
      collectedData.push({
        ...record,
        rawData: data,
      });
    }

    return { collected: collectedData.length, batchId };
  }

  async collectFromProcurementSystem() {
    const batchId = uuidv4();
    const mockData = this.generateMockProcurementData();

    const collectedData = [];
    for (const data of mockData) {
      const record = await this.prisma.collectedData.create({
        data: {
          sourceSystem: 'procurement_system',
          dataType: 'procurement',
          rawData: JSON.stringify(data),
          collectionBatch: batchId,
        },
      });
      collectedData.push({
        ...record,
        rawData: data,
      });
    }

    return { collected: collectedData.length, batchId };
  }

  async collectFromFinancialSystem() {
    const batchId = uuidv4();
    const mockData = this.generateMockFinancialData();

    const collectedData = [];
    for (const data of mockData) {
      const record = await this.prisma.collectedData.create({
        data: {
          sourceSystem: 'financial_system',
          dataType: 'financial',
          rawData: JSON.stringify(data),
          collectionBatch: batchId,
        },
      });
      collectedData.push({
        ...record,
        rawData: data,
      });
    }

    return { collected: collectedData.length, batchId };
  }

  async collectAll() {
    const [contractResult, procurementResult, financialResult] = await Promise.all([
      this.collectFromContractSystem(),
      this.collectFromProcurementSystem(),
      this.collectFromFinancialSystem(),
    ]);

    return {
      contract: contractResult,
      procurement: procurementResult,
      financial: financialResult,
      total: contractResult.collected + procurementResult.collected + financialResult.collected,
    };
  }

  private generateMockContractData() {
    const auditObjects = ['财务部', '采购部', '销售部', '人力资源部', '技术部'];
    const contractTypes = ['采购合同', '销售合同', '服务合同', '劳动合同'];
    const data = [];

    for (let i = 0; i < 5; i++) {
      data.push({
        contractNo: `CT${dayjs().format('YYYYMMDD')}${String(i + 1).padStart(4, '0')}`,
        contractName: `${auditObjects[i]}${contractTypes[Math.floor(Math.random() * contractTypes.length)]}`,
        amount: Math.floor(Math.random() * 1000000) + 10000,
        partyA: auditObjects[i],
        partyB: `供应商${i + 1}有限公司`,
        signDate: dayjs().subtract(Math.random() * 90, 'day').format('YYYY-MM-DD'),
        effectiveDate: dayjs().subtract(Math.random() * 60, 'day').format('YYYY-MM-DD'),
        expiryDate: dayjs().add(Math.random() * 365, 'day').format('YYYY-MM-DD'),
        status: ['active', 'expired', 'terminated'][Math.floor(Math.random() * 3)],
        riskIndicators: {
          hasExceptions: Math.random() > 0.7,
          overduePayments: Math.floor(Math.random() * 5),
          contractDisputes: Math.random() > 0.8 ? 1 : 0,
        },
      });
    }

    return data;
  }

  private generateMockProcurementData() {
    const categories = ['办公用品', 'IT设备', '原材料', '服务外包', '固定资产'];
    const data = [];

    for (let i = 0; i < 8; i++) {
      const items = [];
      for (let j = 0; j < Math.floor(Math.random() * 5) + 1; j++) {
        items.push({
          name: `${categories[Math.floor(Math.random() * categories.length)]}${j + 1}`,
          quantity: Math.floor(Math.random() * 100) + 1,
          unitPrice: Math.floor(Math.random() * 10000) + 100,
        });
      }

      data.push({
        orderNo: `PO${dayjs().format('YYYYMMDD')}${String(i + 1).padStart(4, '0')}`,
        items,
        totalAmount: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
        supplier: `供应商${Math.floor(Math.random() * 10) + 1}有限公司`,
        requestDate: dayjs().subtract(Math.random() * 30, 'day').format('YYYY-MM-DD'),
        approvalStatus: ['pending', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
        riskIndicators: {
          singleSupplier: Math.random() > 0.6,
          priceDeviation: Math.random() > 0.8,
          incompleteApproval: Math.random() > 0.7,
          abnormallyHigh: Math.random() > 0.85,
        },
      });
    }

    return data;
  }

  private generateMockFinancialData() {
    const departments = ['财务部', '销售部', '采购部', '技术部', '人力资源部', '运营部'];
    const data = [];

    for (let i = 0; i < departments.length; i++) {
      const revenue = Math.floor(Math.random() * 10000000) + 1000000;
      const cost = Math.floor(revenue * (0.5 + Math.random() * 0.4));
      const profit = revenue - cost;

      data.push({
        department: departments[i],
        period: dayjs().format('YYYY-MM'),
        revenue,
        cost,
        profit,
        profitMargin: ((profit / revenue) * 100).toFixed(2),
        balanceSheet: {
          assets: Math.floor(Math.random() * 50000000) + 10000000,
          liabilities: Math.floor(Math.random() * 30000000) + 5000000,
          equity: Math.floor(Math.random() * 20000000) + 5000000,
          debtRatio: (Math.random() * 80 + 10).toFixed(2),
          cashFlow: Math.floor(Math.random() * 5000000) - 1000000,
        },
        riskIndicators: {
          highDebtRatio: Number((Math.random() * 80 + 10).toFixed(2)) > 60,
          negativeCashFlow: Math.random() > 0.7,
          lowProfitMargin: Number(((profit / revenue) * 100).toFixed(2)) < 5,
          abnormalExpenses: Math.random() > 0.8,
        },
      });
    }

    return data;
  }
}
