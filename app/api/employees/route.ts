import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district');
  const search = searchParams.get('search')?.toLowerCase();

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
    if (!body.name || !body.mobileNumber || !body.district) {
      return NextResponse.json(
        { success: false, error: 'Name, Mobile, and District are required' },
        { status: 400 }
      );
    }

    const newEmp = await db.addEmployee({
      id: `emp-${Date.now()}`,
      empId: body.empId || `INV-${Math.floor(100 + Math.random() * 900)}`,
      name: body.name,
      mobileNumber: body.mobileNumber,
      designation: body.designation || 'Field Officer',
      district: body.district,
      territory: body.territory || `${body.district} General`,
      dailyVisitTarget: Number(body.dailyVisitTarget) || 10,
      isActive: true,
    });

    return NextResponse.json({ success: true, employee: newEmp });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
