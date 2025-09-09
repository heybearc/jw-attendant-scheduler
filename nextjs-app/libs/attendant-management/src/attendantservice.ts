// Attendant Management Service - SDD Library
import { PrismaClient } from '@prisma/client';

export interface Attendant {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendantRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface UpdateAttendantRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export class AttendantService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getAllAttendants(): Promise<Attendant[]> {
    return await this.prisma.attendant.findMany({
      orderBy: { lastName: 'asc' }
    });
  }

  async getAttendantById(id: number): Promise<Attendant | null> {
    return await this.prisma.attendant.findUnique({
      where: { id }
    });
  }

  async createAttendant(data: CreateAttendantRequest): Promise<Attendant> {
    return await this.prisma.attendant.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        isActive: true
      }
    });
  }

  async updateAttendant(id: number, data: UpdateAttendantRequest): Promise<Attendant> {
    return await this.prisma.attendant.update({
      where: { id },
      data
    });
  }

  async deleteAttendant(id: number): Promise<void> {
    await this.prisma.attendant.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async getActiveAttendants(): Promise<Attendant[]> {
    return await this.prisma.attendant.findMany({
      where: { isActive: true },
      orderBy: { lastName: 'asc' }
    });
  }

  async searchAttendants(query: string): Promise<Attendant[]> {
    return await this.prisma.attendant.findMany({
      where: {
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { email: { contains: query } }
        ],
        isActive: true
      },
      orderBy: { lastName: 'asc' }
    });
  }
}
