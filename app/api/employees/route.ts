import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncEmployeesFromGoogleSheet } from '@/lib/sheet-sync';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district');
  const search = searchParams.get('search')?.toLowerCase();
  const doSync = searchParams.get('sync');

  if (doSync === 'true') {
    await syncEmployeesFromGoogleSheet();
  }

  let employees = await db.getEmployees();

  if (district && district !== 'ALL') {
    employees = employees.filter((e) => e.district === district);
  }

  if (search) {
    employees = employees.filter(
      (e) =>
        e.name.toLowerCase().includes(search) ||
        e.empId.toLowerCase().includes(search) ||
        e.territory.toLowerCase().includes(search) ||
        e.mobileNumber.includes(search)
    );
  }

  return NextResponse.json({
    success: true,
    count: employees.length,
    employees,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.mobileNumber) {
      return NextResponse.json(
        { success: false, error: 'Name and Mobile number are required' },
        { status: 400 }
      );
    }

    const cleanMobile = String(body.mobileNumber).replace(/[\s\-\+]/g, '');
    const tenDigit = cleanMobile.length > 10 ? cleanMobile.slice(-10) : cleanMobile;

    const newEmp = await db.addEmployee({
      id: `emp-${Date.now()}`,
      empId: body.empId || `INV-${Math.floor(100 + Math.random() * 900)}`,
      name: body.name,
      mobileNumber: tenDigit,
      designation: body.designation || 'Field Officer',
      district: body.district || 'Betul',
      territory: body.territory || `${body.district || 'Betul'} Zone`,
      dailyVisitTarget: Number(body.dailyVisitTarget) || 10,
      isActive: true,
    });

    return NextResponse.json({ success: true, employee: newEmp });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID (id) is required for update' },
        { status: 400 }
      );
    }

    const updatedEmp = await db.updateEmployee(body.id, body);
    if (!updatedEmp) {
      return NextResponse.json(
        { success: false, error: `Employee with id ${body.id} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee: updatedEmp });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
