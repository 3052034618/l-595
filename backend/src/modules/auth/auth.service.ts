import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import dayjs from 'dayjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: dayjs().toDate() },
    });

    const payload = { sub: user.id, username: user.username, role: user.role };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: this.getPermissionsByRole(user.role),
      },
    };
  }

  private getPermissionsByRole(role: string): string[] {
    const permissions: Record<string, string[]> = {
      admin: ['*'],
      audit_manager: [
        'audit:view', 'audit:create', 'audit:edit', 'audit:delete',
        'risk:view', 'risk:manage',
        'plan:view', 'plan:create', 'plan:approve', 'plan:assign',
        'evidence:view', 'evidence:delete',
        'finding:view', 'finding:create', 'finding:edit',
        'rectification:view', 'rectification:verify',
        'report:view', 'report:create', 'report:export',
        'log:view',
        'setting:manage',
      ],
      auditor: [
        'audit:view',
        'risk:view',
        'plan:view',
        'evidence:view', 'evidence:create', 'evidence:edit',
        'finding:view', 'finding:create', 'finding:edit',
        'rectification:view', 'rectification:update',
        'report:view',
      ],
      department_head: [
        'audit:view',
        'finding:view', 'finding:confirm',
        'rectification:view', 'rectification:create', 'rectification:update',
      ],
      executive: [
        'audit:view',
        'risk:view',
        'plan:view',
        'finding:view',
        'rectification:view',
        'report:view', 'report:export',
      ],
    };
    return permissions[role] || [];
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, username: true, name: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      const newPayload = { sub: user.id, username: user.username, role: user.role };
      return {
        accessToken: this.jwtService.sign(newPayload),
      };
    } catch {
      throw new UnauthorizedException('Refresh Token 无效');
    }
  }
}
