import { NextResponse } from 'next/server';
import { syncEmployeesFromGoogleSheet } from '@/lib/sheet-sync';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await syncEmployeesFromGoogleSheet();
  return NextResponse.json(result);
}

export async function POST() {
  const result = await syncEmployeesFromGoogleSheet();
  return NextResponse.json(result);
}
