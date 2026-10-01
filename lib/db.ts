import { PrismaClient } from '@prisma/client';
import { Employee, Visit } from './types';
import { INITIAL_EMPLOYEES, INITIAL_VISITS } from './seed-data';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// In-memory fallback cache when DATABASE_URL is not configured
let inMemoryEmployees: Employee[] = [...INITIAL_EMPLOYEES];
let inMemoryVisits: Visit[] = [...INITIAL_VISITS];

class DatabaseStore {
  // Employee Methods
  async getEmployees(): Promise<Employee[]> {
    try {
      if (!process.env.DATABASE_URL) return inMemoryEmployees;
      const emps = await prisma.employee.findMany();
      if (!emps || emps.length === 0) return inMemoryEmployees;
      return emps as unknown as Employee[];
    } catch (error) {
      console.warn('Prisma getEmployees error, returning fallback:', error);
      return inMemoryEmployees;
    }
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      if (!process.env.DATABASE_URL) {
        return inMemoryEmployees.find((e) => e.id === id) || null;
      }
      const emp = await prisma.employee.findUnique({ where: { id } });
      return emp ? (emp as unknown as Employee) : (inMemoryEmployees.find((e) => e.id === id) || null);
    } catch (error) {
      console.warn('Prisma getEmployeeById error, returning fallback:', error);
      return inMemoryEmployees.find((e) => e.id === id) || null;
    }
  }

  async getEmployeeByMobile(mobileNumber: string): Promise<Employee | null> {
    const clean = mobileNumber.replace(/[\s\-\+]/g, '');
    const tenDigit = clean.length > 10 ? clean.slice(-10) : clean;

    const employees = await this.getEmployees();
    const emp = employees.find((e) => {
      const empClean = e.mobileNumber.replace(/[\s\-\+]/g, '');
      const empTenDigit = empClean.length > 10 ? empClean.slice(-10) : empClean;
      return empTenDigit === tenDigit;
    });
    return emp || null;
  }

  async addEmployee(emp: any): Promise<Employee> {
    const newEmp: Employee = {
      id: emp.id || `emp-${Date.now()}`,
      empId: emp.empId || `INV-${Math.floor(100 + Math.random() * 900)}`,
      name: emp.name,
      mobileNumber: emp.mobileNumber,
      designation: emp.designation || 'Field Officer',
      district: emp.district,
      territory: emp.territory || `${emp.district} General`,
      dailyVisitTarget: Number(emp.dailyVisitTarget) || 10,
      isActive: true,
    };

    try {
      if (process.env.DATABASE_URL) {
        const created = await prisma.employee.create({ data: emp });
        inMemoryEmployees.unshift(created as unknown as Employee);
        return created as unknown as Employee;
      }
    } catch (error) {
      console.warn('Prisma addEmployee error, saving to in-memory store:', error);
    }

    inMemoryEmployees.unshift(newEmp);
    return newEmp;
  }

  // Visit Methods
  async getVisits(): Promise<Visit[]> {
    try {
      if (!process.env.DATABASE_URL) return inMemoryVisits;
      const visits = await prisma.visit.findMany({
        orderBy: { timestamp: 'desc' },
      });
      return visits.map(this.mapPrismaVisit) as Visit[];
    } catch (error) {
      console.warn('Prisma getVisits error, returning fallback:', error);
      return inMemoryVisits;
    }
  }

  async getVisitsByEmployee(employeeId: string): Promise<Visit[]> {
    const visits = await this.getVisits();
    return visits.filter((v) => v.employeeId === employeeId);
  }

  async getTodayVisitsByEmployee(employeeId: string): Promise<Visit[]> {
    const todayStr = new Date().toISOString().split('T')[0];
    const visits = await this.getVisitsByEmployee(employeeId);
    return visits.filter((v) => v.timestamp.startsWith(todayStr));
  }

  async addVisit(visit: Visit): Promise<Visit> {
    try {
      if (process.env.DATABASE_URL) {
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
          },
        });
        const mapped = this.mapPrismaVisit(v) as Visit;
        inMemoryVisits.unshift(mapped);
        return mapped;
      }
    } catch (error) {
      console.warn('Prisma addVisit error, saving to in-memory store:', error);
    }

    inMemoryVisits.unshift(visit);
    return visit;
  }

  private mapPrismaVisit(v: any) {
    let tags = [];
    try {
      tags = typeof v.aiTags === 'string' ? JSON.parse(v.aiTags) : v.aiTags || [];
    } catch {
      tags = [];
    }

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
        tags,
      },
    };
  }
}

export const db = new DatabaseStore();
