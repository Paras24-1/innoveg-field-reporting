import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Visit } from '@/lib/types';
import { calculateDistanceKm, isDuplicateLocation } from '@/lib/geo';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const N8N_SECRET = process.env.N8N_SECRET_TOKEN || 'n8n_secret';

    if (authHeader !== `Bearer ${N8N_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Verify minimum required fields
    if (!body.employeeMobile || !body.visitType || !body.latitude || !body.longitude) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Get employee details
    const employee = await db.getEmployeeByMobile(body.employeeMobile);
    if (!employee) {
       return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Calculate distance and repeat locations if not provided by n8n
    const todayVisits = await db.getTodayVisitsByEmployee(employee.id);
    const lastVisit = todayVisits.length > 0 ? todayVisits[0] : undefined;
    let distanceFromPrev = 0;
    if (lastVisit) {
      distanceFromPrev = calculateDistanceKm(lastVisit.latitude, lastVisit.longitude, body.latitude, body.longitude);
    }

    const allEmpVisits = await db.getVisitsByEmployee(employee.id);
    const isRepeat = isDuplicateLocation(body.latitude, body.longitude, allEmpVisits, 150);

    const newVisit: Visit = {
      id: `v-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeMobile: employee.mobileNumber,
      district: employee.district,
      territory: employee.territory,
      visitType: body.visitType,
      entityName: body.entityName || 'Entity',
      village: body.village || employee.territory,
      latitude: body.latitude,
      longitude: body.longitude,
      locationName: body.locationName || `${body.village || employee.territory}, ${employee.district}`,
      photoUrl: body.photoUrl || 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22513?w=600&auto=format&fit=crop&q=80',
      remarksBooking: body.remarksBooking || 'No specific remarks',
      isRepeatLocation: body.isRepeatLocation !== undefined ? body.isRepeatLocation : isRepeat,
      distanceFromPrevKm: body.distanceFromPrevKm !== undefined ? body.distanceFromPrevKm : distanceFromPrev,
      aiAnalysis: body.aiAnalysis || {
         qualityScore: 80,
         isBlur: false,
         fieldVisible: true,
         personVisible: true,
         brandingVisible: false,
         visitTypeMatch: true,
         summaryHindi: 'Processed by n8n',
         summaryEnglish: 'Processed by n8n',
         tags: ['n8n']
      },
      timestamp: new Date().toISOString(),
    };

    const savedVisit = await db.addVisit(newVisit);

    return NextResponse.json({ success: true, visit: savedVisit });

  } catch (error: any) {
    console.error('N8N Webhook Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
