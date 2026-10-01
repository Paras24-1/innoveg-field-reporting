import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const deleted = await prisma.visit.deleteMany({});
    return NextResponse.json({
      success: true,
      message: 'Purged all visits from database',
      deletedCount: deleted.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const deleted = await prisma.visit.deleteMany({});
    return NextResponse.json({
      success: true,
      message: 'Purged all visits from database',
      deletedCount: deleted.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
