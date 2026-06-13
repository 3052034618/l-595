import { Controller, Get, Post, Body, Param, Delete, Query, HttpCode, HttpStatus, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { EvidencesService } from './evidences.service';
import { ExportPackageDto } from './dto/export-package.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Controller('evidences')
@Roles('admin', 'audit_manager', 'auditor')
export class EvidencesController {
  constructor(private readonly evidencesService: EvidencesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads');
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const fileName = `${uuidv4()}-${file.originalname}`;
          cb(null, fileName);
        },
      }),
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      auditObjectId?: string;
      auditPlanId?: string;
      findingId?: string;
      description?: string;
      tags?: string;
    },
    @GetUser() user: any,
  ): Promise<ApiResponse> {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    const data = await this.evidencesService.create(file, body, user?.id);
    
    if (data.validationStatus === 'invalid') {
      return {
        code: 400,
        message: data.validationMessage || '文件校验失败',
        data,
        timestamp: Date.now(),
      };
    }

    return {
      code: 0,
      message: '上传成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Get()
  async findAll(
    @Query() query: {
      page?: number;
      pageSize?: number;
      auditObjectId?: string;
      auditPlanId?: string;
      findingId?: string;
      fileType?: string;
      uploadedBy?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<ApiResponse> {
    const data = await this.evidencesService.findAll(query);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.evidencesService.findOne(id);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post('export-package')
  async exportPackage(@Body() exportPackageDto: ExportPackageDto): Promise<ApiResponse> {
    const data = await this.evidencesService.exportPackage(exportPackageDto);
    return {
      code: 0,
      message: '打包成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'audit_manager')
  async remove(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.evidencesService.remove(id);
    return {
      code: 0,
      message: '删除成功',
      data,
      timestamp: Date.now(),
    };
  }
}
