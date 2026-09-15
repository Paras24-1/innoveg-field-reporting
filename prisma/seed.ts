const { PrismaClient } = require('@prisma/client');
const { INITIAL_EMPLOYEES, INITIAL_VISITS } = require('../lib/seed-data.js'); // Wait, seed-data is ts. Better to run it via ts-node.

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding employees...');
  for (const emp of INITIAL_EMPLOYEES) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: {},
      create: {
        id: emp.id,
        empId: emp.empId,
        name: emp.name,
        mobileNumber: emp.mobileNumber,
        designation: emp.designation,
        district: emp.district,
        territory: emp.territory,
        dailyVisitTarget: emp.dailyVisitTarget,
        avatarUrl: emp.avatarUrl,
        isActive: emp.isActive,
      }
    });
  }

  console.log('Seeding visits...');
  for (const visit of INITIAL_VISITS) {
    const aiAnalysis = visit.aiAnalysis;
    await prisma.visit.upsert({
      where: { id: visit.id },
      update: {},
      create: {
        id: visit.id,
        employeeId: visit.employeeId,
        employeeName: visit.employeeName,
        employeeMobile: visit.employeeMobile,
        territory: visit.territory,
        district: visit.district,
        visitType: visit.visitType,
        entityName: visit.entityName,
        village: visit.village,
        latitude: visit.latitude,
        longitude: visit.longitude,
        locationName: visit.locationName,
        photoUrl: visit.photoUrl,
        remarksBooking: visit.remarksBooking,
        isRepeatLocation: visit.isRepeatLocation,
        distanceFromPrevKm: visit.distanceFromPrevKm,
        timestamp: visit.timestamp,
        aiQualityScore: aiAnalysis.qualityScore,
        aiIsBlur: aiAnalysis.isBlur,
        aiFieldVisible: aiAnalysis.fieldVisible,
        aiPersonVisible: aiAnalysis.personVisible,
        aiBrandingVisible: aiAnalysis.brandingVisible,
        aiVisitTypeMatch: aiAnalysis.visitTypeMatch,
        aiSummaryHindi: aiAnalysis.summaryHindi,
        aiSummaryEnglish: aiAnalysis.summaryEnglish,
        aiTags: JSON.stringify(aiAnalysis.tags),
      }
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
