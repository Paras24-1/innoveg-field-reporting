import { NextResponse } from 'next/server';
import { analyzeFieldPhoto } from '@/lib/ai-vision';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { photoUrl, visitType = 'Dealer Visit', entityName = 'Sample Farm' } = body;

    if (!photoUrl) {
      return NextResponse.json({ success: false, error: 'photoUrl is required' }, { status: 400 });
    }

    const result = await analyzeFieldPhoto(photoUrl, visitType, entityName);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
