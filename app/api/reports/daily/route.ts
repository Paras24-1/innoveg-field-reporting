import { NextResponse } from 'next/server';
import { generateDailyManagementSummary, formatWhatsAppDailyReportText } from '@/lib/report-generator';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || undefined;

  const summary = generateDailyManagementSummary(date);
  const formattedText = formatWhatsAppDailyReportText(summary);

  return NextResponse.json({
    success: true,
    summary,
    formattedWhatsAppText: formattedText,
  });
}
