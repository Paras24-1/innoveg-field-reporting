import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const district = searchParams.get('district');
  const visitType = searchParams.get('visitType');
  const date = searchParams.get('date');

  let visits = db.getVisits();

  if (employeeId) {
    visits = visits.filter((v) => v.employeeId === employeeId);
  }

  if (district && district !== 'ALL') {
    visits = visits.filter((v) => v.district === district);
  }

  if (visitType && visitType !== 'ALL') {
    visits = visits.filter((v) => v.visitType === visitType);
  }

  if (date) {
    visits = visits.filter((v) => v.timestamp.startsWith(date));
  }

  return NextResponse.json({
    success: true,
    count: visits.length,
    visits,
  });
}
