import { NextResponse } from 'next/server';
import { processIncomingWhatsAppMessage } from '@/lib/bot-engine';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fromMobile, message, location, photoUrl, resetSession } = body;

    if (!fromMobile) {
      return NextResponse.json({ success: false, error: 'fromMobile is required' }, { status: 400 });
    }

    if (resetSession) {
      db.clearSession(fromMobile);
    }

    const response = await processIncomingWhatsAppMessage({
      fromMobile,
      body: message,
      location,
      photoUrl,
    });

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
