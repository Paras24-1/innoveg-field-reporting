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
      name: String(emp.name || 'Field Officer').replace(/^=/, '').trim(),
      mobileNumber: emp.mobileNumber,
      designation: emp.designation || 'Field Officer',
      district: String(emp.district || 'Betul').replace(/^=/, '').trim(),
      territory: String(emp.territory || `${emp.district} General`).replace(/^=/, '').trim(),
      dailyVisitTarget: Number(emp.dailyVisitTarget) || 10,
      isActive: true,
    };

    try {
      if (process.env.DATABASE_URL) {
        const created = await prisma.employee.create({
          data: {
            id: newEmp.id,
            empId: newEmp.empId,
            name: newEmp.name,
            mobileNumber: newEmp.mobileNumber,
            designation: newEmp.designation,
            district: newEmp.district,
            territory: newEmp.territory,
            dailyVisitTarget: newEmp.dailyVisitTarget,
            isActive: true,
          }
        });
        inMemoryEmployees.unshift(created as unknown as Employee);
        return created as unknown as Employee;
      }
    } catch (error) {
      console.warn('Prisma addEmployee error:', error);
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
    const lat = Number(visit.latitude);
    const lng = Number(visit.longitude);
    const safeLat = isNaN(lat) ? 21.7709 : lat;
    const safeLng = isNaN(lng) ? 78.2575 : lng;

    const safeVisit: Visit = {
      ...visit,
      visitType: String(visit.visitType || 'Farmer Visit').replace(/^=/, '').trim() as any,
      entityName: String(visit.entityName || 'Entity').replace(/^=/, '').trim(),
      village: String(visit.village || 'Field').replace(/^=/, '').trim(),
      locationName: String(visit.locationName || 'Field Location').replace(/^=/, '').trim(),
      remarksBooking: String(visit.remarksBooking || 'No specific remarks').replace(/^=/, '').trim(),
      latitude: safeLat,
      longitude: safeLng,
    };

    try {
      if (process.env.DATABASE_URL) {
        const aiAnalysis = safeVisit.aiAnalysis || {
          qualityScore: 80,
          isBlur: false,
          fieldVisible: true,
          personVisible: true,
          brandingVisible: false,
          visitTypeMatch: true,
          summaryHindi: '',
          summaryEnglish: '',
          tags: []
        };

        const v = await prisma.visit.create({
          data: {
            id: safeVisit.id,
            employeeId: safeVisit.employeeId,
            employeeName: safeVisit.employeeName,
            employeeMobile: safeVisit.employeeMobile,
            territory: safeVisit.territory,
            district: safeVisit.district,
            visitType: safeVisit.visitType,
            entityName: safeVisit.entityName,
            village: safeVisit.village,
            latitude: safeLat,
            longitude: safeLng,
            locationName: safeVisit.locationName,
            photoUrl: safeVisit.photoUrl || '',
            remarksBooking: safeVisit.remarksBooking,
            isRepeatLocation: Boolean(safeVisit.isRepeatLocation),
            distanceFromPrevKm: Number(safeVisit.distanceFromPrevKm) || 0,
            timestamp: safeVisit.timestamp || new Date().toISOString(),
            // AI embedded fields
            aiQualityScore: Number(aiAnalysis.qualityScore) || 80,
            aiIsBlur: Boolean(aiAnalysis.isBlur),
            aiFieldVisible: Boolean(aiAnalysis.fieldVisible),
            aiPersonVisible: Boolean(aiAnalysis.personVisible),
            aiBrandingVisible: Boolean(aiAnalysis.brandingVisible),
            aiVisitTypeMatch: Boolean(aiAnalysis.visitTypeMatch),
            aiSummaryHindi: String(aiAnalysis.summaryHindi || ''),
            aiSummaryEnglish: String(aiAnalysis.summaryEnglish || ''),
            aiTags: JSON.stringify(Array.isArray(aiAnalysis.tags) ? aiAnalysis.tags : []),
          },
        });
        const mapped = this.mapPrismaVisit(v) as Visit;
        inMemoryVisits.unshift(mapped);
        return mapped;
      }
    } catch (error) {
      console.warn('Prisma addVisit error:', error);
    }

    inMemoryVisits.unshift(safeVisit);
    return safeVisit;
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
