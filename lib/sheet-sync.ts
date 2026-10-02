import { db, prisma } from './db';
import { Employee } from './types';

const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1TkRZFJbCj9c7LX13S3h-pSodPSYr1uxbgKADU6cZb_E/export?format=csv';

export async function syncEmployeesFromGoogleSheet(): Promise<{
  success: boolean;
  count: number;
  message: string;
  employees: Employee[];
}> {
  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Google Sheet CSV: HTTP ${res.status}`);
    }

    const csvText = await res.text();
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length <= 1) {
      throw new Error('Google Sheet is empty or missing headers');
    }

    // Skip header line
    const rows = lines.slice(1);
    const syncedEmployees: Employee[] = [];

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i].split(',').map((col) => col.trim().replace(/^"|"$/g, ''));
      const rawEmpId = cols[0] || '';
      const rawName = cols[1] || '';
      const rawMobile = cols[2] || '';
      const rawDesignation = cols[3] || 'Field Officer';
      const rawDistrict = cols[4] || 'Betul';
      const rawTerritory = cols[5] || 'General Zone';
      const rawTarget = Number(cols[6]) || 10;
      const rawActive = cols[7]?.toUpperCase() !== 'FALSE';
      const rawJoined = cols[8] || null;

      if (!rawName || !rawMobile) continue;

      const cleanMobile = rawMobile.replace(/[\s\-\+]/g, '');
      const tenDigit = cleanMobile.length > 10 ? cleanMobile.slice(-10) : cleanMobile;
      const empId = rawEmpId || `INV-${100 + i}`;

      const empData = {
        id: `emp-gs-${empId}`,
        empId,
        name: rawName,
        mobileNumber: tenDigit,
        designation: rawDesignation || 'Field Officer',
        district: rawDistrict || 'Betul',
        territory: rawTerritory || 'General Zone',
        dailyVisitTarget: rawTarget,
        isActive: rawActive,
        joinedDate: rawJoined,
      };

      if (process.env.DATABASE_URL) {
        const upserted = await prisma.employee.upsert({
          where: { mobileNumber: tenDigit },
          update: {
            name: rawName,
            empId,
            designation: rawDesignation || 'Field Officer',
            district: rawDistrict || 'Betul',
            territory: rawTerritory || 'General Zone',
            dailyVisitTarget: rawTarget,
            isActive: rawActive,
          },
          create: {
            id: empData.id,
            empId,
            name: rawName,
            mobileNumber: tenDigit,
            designation: rawDesignation || 'Field Officer',
            district: rawDistrict || 'Betul',
            territory: rawTerritory || 'General Zone',
            dailyVisitTarget: rawTarget,
            isActive: rawActive,
          },
        });
        syncedEmployees.push(upserted as unknown as Employee);
      } else {
        const added = await db.addEmployee(empData);
        syncedEmployees.push(added);
      }
    }

    return {
      success: true,
      count: syncedEmployees.length,
      message: `Successfully synchronized ${syncedEmployees.length} employees from Google Sheet to Supabase`,
      employees: syncedEmployees,
    };
  } catch (err: any) {
    console.error('Google Sheet Sync Error:', err);
    const existing = await db.getEmployees();
    return {
      success: false,
      count: existing.length,
      message: err.message || 'Failed to sync with Google Sheet',
      employees: existing,
    };
  }
}
