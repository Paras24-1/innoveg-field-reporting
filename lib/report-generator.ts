import { db } from './db';
import { DailySummary, VisitType } from './types';
import { calculateTotalRouteKm } from './geo';

export async function generateDailyManagementSummary(targetDateStr?: string): Promise<DailySummary> {
  const dateStr = targetDateStr || new Date().toISOString().split('T')[0];
  const allEmployees = await db.getEmployees();
  const allVisits = await db.getVisits();

  // Filter visits for the specified date
  const dayVisits = allVisits.filter((v) => {
    return v.timestamp.startsWith(dateStr);
  });

  const activeEmployeeIds = new Set(dayVisits.map((v) => v.employeeId));

  const visitsByType: Record<VisitType, number> = {
    'Farmer Visit': 0,
    'Dealer Visit': 0,
    'Distributor Visit': 0,
    'Field Visit': 0,
    'Field Program': 0,
    'Other': 0,
  };

  let repeatCount = 0;
  let uniqueCount = 0;

  dayVisits.forEach((v) => {
    if (visitsByType[v.visitType] !== undefined) {
      visitsByType[v.visitType]++;
    } else {
      visitsByType['Other']++;
    }

    if (v.isRepeatLocation) {
      repeatCount++;
    } else {
      uniqueCount++;
    }
  });

  // Calculate per employee performance
  const employeePerformances = allEmployees.map((emp) => {
    const empVisits = dayVisits.filter((v) => v.employeeId === emp.id);
    const count = empVisits.length;
    const target = emp.dailyVisitTarget || 10;
    const targetAchievedPercent = Math.min(100, Math.round((count / target) * 100));
    
    // Sort chronological for route
    const chronological = [...empVisits].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const travelKm = calculateTotalRouteKm(chronological);

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      district: emp.district,
      territory: emp.territory,
      visitsCount: count,
      target,
      targetAchievementPercent: targetAchievedPercent,
      travelKm,
      visits: empVisits,
    };
  });

  const totalEstimatedKm = Number(
    employeePerformances.reduce((acc, curr) => acc + curr.travelKm, 0).toFixed(1)
  );

  const totalTargetPlanned = allEmployees.reduce((acc, curr) => acc + curr.dailyVisitTarget, 0);
  const overallTargetAchievementPercent = totalTargetPlanned > 0
    ? Math.round((dayVisits.length / totalTargetPlanned) * 100)
    : 0;

  const activePerformers = employeePerformances.filter((p) => p.visitsCount > 0);
  const sortedByVisits = [...activePerformers].sort((a, b) => b.visitsCount - a.visitsCount);

  const topPerformers = sortedByVisits.slice(0, 5).map((p) => ({
    employeeName: p.employeeName,
    district: p.district,
    visitsCount: p.visitsCount,
    targetAchievementPercent: p.targetAchievementPercent,
    travelKm: p.travelKm,
  }));

  const lowPerformers = employeePerformances
    .filter((p) => p.visitsCount < (p.target * 0.6))
    .slice(0, 5)
    .map((p) => ({
      employeeName: p.employeeName,
      district: p.district,
      visitsCount: p.visitsCount,
      targetAchievementPercent: p.targetAchievementPercent,
    }));

  return {
    date: dateStr,
    totalEmployees: allEmployees.length,
    activeEmployees: activeEmployeeIds.size,
    totalVisits: dayVisits.length,
    uniqueLocations: uniqueCount,
    repeatLocations: repeatCount,
    visitsByType,
    totalEstimatedKm,
    overallTargetAchievementPercent,
    topPerformers,
    lowPerformers,
  };
}

export function formatWhatsAppDailyReportText(summary: DailySummary): string {
  return `📊 *INNOVEG DAILY FIELD REPORT*
📅 *Date:* ${summary.date}
━━━━━━━━━━━━━━━━━━━
👥 *Total Field Officers:* ${summary.totalEmployees}
🟢 *Active Today:* ${summary.activeEmployees} (${Math.round((summary.activeEmployees / summary.totalEmployees) * 100)}%)
📍 *Total Visits Recorded:* ${summary.totalVisits}
✨ *Unique Locations:* ${summary.uniqueLocations}
🔁 *Repeat Locations:* ${summary.repeatLocations}
🚗 *Total Field Travel:* ~${summary.totalEstimatedKm} KM

📈 *Visit Type Breakdown:*
• Farmer Visits: ${summary.visitsByType['Farmer Visit']}
• Dealer Visits: ${summary.visitsByType['Dealer Visit']}
• Distributor Visits: ${summary.visitsByType['Distributor Visit']}
• Field Visits: ${summary.visitsByType['Field Visit']}
• Field Programs: ${summary.visitsByType['Field Program']}
• Others: ${summary.visitsByType['Other']}

🎯 *Overall Target Achievement:* ${summary.overallTargetAchievementPercent}%

🏆 *Top Performing Officers:*
${summary.topPerformers.map((p, idx) => `${idx + 1}. ${p.employeeName} (${p.district}) - ${p.visitsCount} visits (${p.travelKm} KM)`).join('\n') || 'None recorded'}

━━━━━━━━━━━━━━━━━━━
*InnoVeg Central Digital Reporting System*`;
}
