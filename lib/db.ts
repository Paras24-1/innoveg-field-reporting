import { Employee, Visit, BotSession } from './types';
import { INITIAL_EMPLOYEES, INITIAL_VISITS } from './seed-data';

// In-Memory Database Store with pre-populated seed data
class DatabaseStore {
  private employees: Map<string, Employee> = new Map();
  private visits: Visit[] = [];
  private sessions: Map<string, BotSession> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    INITIAL_EMPLOYEES.forEach((emp) => this.employees.set(emp.id, emp));
    this.visits = [...INITIAL_VISITS];
  }

  // Employee Methods
  getEmployees(): Employee[] {
    return Array.from(this.employees.values());
  }

  getEmployeeById(id: string): Employee | undefined {
    return this.employees.get(id);
  }

  getEmployeeByMobile(mobileNumber: string): Employee | undefined {
    // Normalize mobile: remove spaces, dashes, +91 or leading 0
    const clean = mobileNumber.replace(/[\s\-\+]/g, '');
    const tenDigit = clean.length > 10 ? clean.slice(-10) : clean;
    
    return Array.from(this.employees.values()).find((emp) => {
      const empClean = emp.mobileNumber.replace(/[\s\-\+]/g, '');
      const empTenDigit = empClean.length > 10 ? empClean.slice(-10) : empClean;
      return empTenDigit === tenDigit;
    });
  }

  addEmployee(emp: Employee): Employee {
    this.employees.set(emp.id, emp);
    return emp;
  }

  updateEmployee(id: string, updates: Partial<Employee>): Employee | undefined {
    const existing = this.employees.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.employees.set(id, updated);
    return updated;
  }

  // Visit Methods
  getVisits(): Visit[] {
    return [...this.visits].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getVisitsByEmployee(employeeId: string): Visit[] {
    return this.visits.filter((v) => v.employeeId === employeeId);
  }

  getTodayVisitsByEmployee(employeeId: string): Visit[] {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.visits.filter((v) => {
      const vDate = new Date(v.timestamp).toISOString().split('T')[0];
      return v.employeeId === employeeId && vDate === todayStr;
    });
  }

  addVisit(visit: Visit): Visit {
    this.visits.unshift(visit);
    return visit;
  }

  // Session Methods for WhatsApp Chat state
  getSession(mobileNumber: string): BotSession | undefined {
    const clean = mobileNumber.replace(/[\s\-\+]/g, '').slice(-10);
    return this.sessions.get(clean);
  }

  saveSession(session: BotSession): void {
    const clean = session.mobileNumber.replace(/[\s\-\+]/g, '').slice(-10);
    this.sessions.set(clean, session);
  }

  clearSession(mobileNumber: string): void {
    const clean = mobileNumber.replace(/[\s\-\+]/g, '').slice(-10);
    this.sessions.delete(clean);
  }

  resetAll(): void {
    this.employees.clear();
    this.visits = [];
    this.sessions.clear();
    this.seed();
  }
}

// Global Singleton for Next.js hot-reloading preservation
const globalForDb = globalThis as unknown as { innovegDb: DatabaseStore };
export const db = globalForDb.innovegDb || new DatabaseStore();
if (process.env.NODE_ENV !== 'production') globalForDb.innovegDb = db;
