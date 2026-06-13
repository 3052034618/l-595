import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ExportPackageDto } from './dto/export-package.dto';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import archiver from 'archiver';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024;

@Injectable()
export class EvidencesService {
  constructor(private prisma: PrismaService) {}

  validateFile(file: Express.Multer.File) {
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return {
        valid: false,
        message: `不支持的文件类型: ${file.mimetype}。支持的类型: PDF, Word, Excel, 图片, 文本`,
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        message: `文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB。最大支持 50MB`,
      };
    }

    return { valid: true };
  }

  async create(
    file: Express.Multer.File,
    body: {
      auditObjectId?: string;
      auditPlanId?: string;
      findingId?: string;
      description?: string;
      tags?: string;
    },
    userId?: string,
  ) {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return {
        validationStatus: 'invalid',
        validationMessage: validation.message,
      };
    }

    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = join(process.cwd(), 'uploads', fileName);
    const fileUrl = `/uploads/${fileName}`;

    const tags = body.tags ? JSON.parse(body.tags) : [];

    const evidence = await this.prisma.evidence.create({
      data: {
        fileName,
        originalName: file.originalname,
        fileSize: Number(file.size),
        fileType: file.mimetype,
        filePath,
        fileUrl,
        auditObjectId: body.auditObjectId,
        auditPlanId: body.auditPlanId,
        description: body.description,
        tags: JSON.stringify(tags),
        uploadedBy: userId,
        validationStatus: 'valid',
      },
      include: {
        auditObject: { select: { id: true, name: true } },
        auditPlan: { select: { id: true, name: true } },
        uploadedByUser: { select: { id: true, name: true } },
      },
    });

    return {
      ...evidence,
      tags,
    };
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    auditObjectId?: string;
    auditPlanId?: string;
    findingId?: string;
    fileType?: string;
    uploadedBy?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.auditObjectId) where.auditObjectId = query.auditObjectId;
    if (query.auditPlanId) where.auditPlanId = query.auditPlanId;
    if (query.findingId) {
      where.findingEvidences = { some: { findingId: query.findingId } };
    }
    if (query.fileType) where.fileType = query.fileType;
    if (query.uploadedBy) where.uploadedBy = query.uploadedBy;
    if (query.startDate) where.uploadedAt = { gte: dayjs(query.startDate).toDate() };
    if (query.endDate) where.uploadedAt = { ...where.uploadedAt, lte: dayjs(query.endDate).toDate() };

    const [items, total] = await Promise.all([
      this.prisma.evidence.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          auditObject: { select: { id: true, name: true } },
          auditPlan: { select: { id: true, name: true } },
          uploadedByUser: { select: { id: true, name: true } },
        },
        orderBy: { uploadedAt: 'desc' },
      }),
      this.prisma.evidence.count({ where }),
    ]);

    const parsedItems = items.map((item) => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : [],
    }));

    return {
      items: parsedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const evidence = await this.prisma.evidence.findUnique({
      where: { id },
      include: {
        auditObject: true,
        auditPlan: true,
        uploadedByUser: { select: { id: true, name: true } },
        findingEvidences: { include: { finding: true } },
      },
    });

    if (!evidence) {
      throw new NotFoundException('证据不存在');
    }

    return {
      ...evidence,
      tags: evidence.tags ? JSON.parse(evidence.tags) : [],
    };
  }

  async exportPackage(exportPackageDto: ExportPackageDto) {
    const { evidenceIds, password } = exportPackageDto;

    const evidences = await this.prisma.evidence.findMany({
      where: { id: { in: evidenceIds } },
    });

    if (evidences.length === 0) {
      throw new BadRequestException('没有找到证据文件');
    }

    const exportsDir = join(process.cwd(), 'exports');
    if (!existsSync(exportsDir)) {
      mkdirSync(exportsDir, { recursive: true });
    }

    const packageName = `evidence-package-${uuidv4()}.zip`;
    const packagePath = join(exportsDir, packageName);
    const packageUrl = `/exports/${packageName}`;

    return new Promise((resolve, reject) => {
      const output = createWriteStream(packagePath);
      const archive = archiver('zip', {
        zlib: { level: 9 },
        forceZip64: true,
      } as any);

      output.on('close', () => {
        resolve({
          packageUrl,
          packageName,
          downloadUrl: packageUrl,
          fileCount: evidences.length,
          totalSize: archive.pointer(),
        });
      });

      archive.on('error', (err: Error) => {
        reject(err);
      });

      archive.pipe(output);

      for (const evidence of evidences) {
        if (existsSync(evidence.filePath)) {
          archive.file(evidence.filePath, { name: evidence.originalName });
        }
      }

      archive.finalize();
    });
  }

  async remove(id: string) {
    const evidence = await this.prisma.evidence.findUnique({ where: { id } });
    if (!evidence) {
      throw new NotFoundException('证据不存在');
    }

    if (existsSync(evidence.filePath)) {
      try {
        unlinkSync(evidence.filePath);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }

    await this.prisma.evidence.delete({ where: { id } });
    return { message: '删除成功' };
  }
}
