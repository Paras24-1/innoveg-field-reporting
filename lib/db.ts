import { PrismaClient } from '@prisma/client';
import { Employee, Visit } from './types';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

class DatabaseStore {
  // Employee Methods
  async getEmployees(): Promise<Employee[]> {
    return prisma.employee.findMany() as unknown as Employee[];
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    return prisma.employee.findUnique({ where: { id } }) as unknown as Employee | null;
  }

  async getEmployeeByMobile(mobileNumber: string): Promise<Employee | null> {
    const clean = mobileNumber.replace(/[\s\-\+]/g, '');
    const tenDigit = clean.length > 10 ? clean.slice(-10) : clean;
    
    // In production, mobile numbers should be stored normalized.
    // For now, we fetch all and find, or assume they are stored cleanly.
    // To be safe and compatible with previous mock logic:
    const employees = await prisma.employee.findMany();
    const emp = employees.find((emp) => {
      const empClean = emp.mobileNumber.replace(/[\s\-\+]/g, '');
      const empTenDigit = empClean.length > 10 ? empClean.slice(-10) : empClean;
      return empTenDigit === tenDigit;
    });
    return emp as unknown as Employee | null;
  }

  async addEmployee(emp: any): Promise<Employee> {
    return prisma.employee.create({ data: emp }) as unknown as Employee;
  }

  // Visit Methods
  async getVisits(): Promise<Visit[]> {
    const visits = await prisma.visit.findMany({
      orderBy: { timestamp: 'desc' }
    });
    return visits.map(this.mapPrismaVisit) as Visit[];
  }

  async getVisitsByEmployee(employeeId: string): Promise<Visit[]> {
    const visits = await prisma.visit.findMany({
      where: { employeeId },
      orderBy: { timestamp: 'desc' }
    });
    return visits.map(this.mapPrismaVisit) as Visit[];
  }

  async getTodayVisitsByEmployee(employeeId: string): Promise<Visit[]> {
    const todayStr = new Date().toISOString().split('T')[0];
    const visits = await prisma.visit.findMany({
      where: {
        employeeId,
        timestamp: { startsWith: todayStr }
      },
      orderBy: { timestamp: 'desc' }
    });
    return visits.map(this.mapPrismaVisit) as Visit[];
  }

  async addVisit(visit: Visit): Promise<Visit> {
    const aiAnalysis = visit.aiAnalysis;
    const v = await prisma.visit.create({
      data: {
        id: visit.id,
        employeeId: visit.employeeId,
        employeeName: visit.employeeName,
        employeeMobile: visit.employeeMobile,
        territory: visit.territory,
        district: visit.district,
        visitType: visit.visitType,
        entityName: visit.entityName,
        village: visit.village,
        latitude: visit.latitude,
        longitude: visit.longitude,
        locationName: visit.locationName,
        photoUrl: visit.photoUrl,
        remarksBooking: visit.remarksBooking,
        isRepeatLocation: visit.isRepeatLocation,
        distanceFromPrevKm: visit.distanceFromPrevKm,
        timestamp: visit.timestamp,
        // AI embedded fields
        aiQualityScore: aiAnalysis.qualityScore,
        aiIsBlur: aiAnalysis.isBlur,
        aiFieldVisible: aiAnalysis.fieldVisible,
        aiPersonVisible: aiAnalysis.personVisible,
        aiBrandingVisible: aiAnalysis.brandingVisible,
        aiVisitTypeMatch: aiAnalysis.visitTypeMatch,
        aiSummaryHindi: aiAnalysis.summaryHindi,
        aiSummaryEnglish: aiAnalysis.summaryEnglish,
        aiTags: JSON.stringify(aiAnalysis.tags),
      }
    });
    return this.mapPrismaVisit(v) as Visit;
  }


  private mapPrismaVisit(v: any) {
    return {
      ...v,
      aiAnalysis: {
        qualityScore: v.aiQualityScore,
        isBlur: v.aiIsBlur,
        fieldVisible: v.aiFieldVisible,
        personVisible: v.aiPersonVisible,
        brandingVisible: v.aiBrandingVisible,
        visitTypeMatch: v.aiVisitTypeMatch,
        summaryHindi: v.aiSummaryHindi,
        summaryEnglish: v.aiSummaryEnglish,
        tags: JSON.parse(v.aiTags),
      }
    };
  }
}

export const db = new DatabaseStore();
