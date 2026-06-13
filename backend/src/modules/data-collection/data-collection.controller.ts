import { Controller, Post, Get } from '@nestjs/common';
import { DataCollectionService } from './data-collection.service';
import { Roles } from '../../common/decorators/roles.decorator';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Controller('data-collection')
@Roles('admin', 'audit_manager')
export class DataCollectionController {
  constructor(private readonly dataCollectionService: DataCollectionService) {}

  @Post('collect-all')
  async collectAll(): Promise<ApiResponse> {
    const data = await this.dataCollectionService.collectAll();
    return {
      code: 0,
      message: '数据采集完成',
      data,
      timestamp: Date.now(),
    };
  }

  @Post('contract')
  async collectFromContractSystem(): Promise<ApiResponse> {
    const data = await this.dataCollectionService.collectFromContractSystem();
    return {
      code: 0,
      message: '合同系统数据采集完成',
      data,
      timestamp: Date.now(),
    };
  }

  @Post('procurement')
  async collectFromProcurementSystem(): Promise<ApiResponse> {
    const data = await this.dataCollectionService.collectFromProcurementSystem();
    return {
      code: 0,
      message: '采购系统数据采集完成',
      data,
      timestamp: Date.now(),
    };
  }

  @Post('financial')
  async collectFromFinancialSystem(): Promise<ApiResponse> {
    const data = await this.dataCollectionService.collectFromFinancialSystem();
    return {
      code: 0,
      message: '财务系统数据采集完成',
      data,
      timestamp: Date.now(),
    };
  }
}
