const { PrismaClient } = require('@prisma/client');
const employees = require('../lib/real-employees.json');

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${employees.length} real field officers into Supabase...`);

  for (const emp of employees) {
    const cleanMobile = emp.mobileNumber.replace(/[\s\-\+]/g, '');
    const tenDigit = cleanMobile.length > 10 ? cleanMobile.slice(-10) : cleanMobile;

    await prisma.employee.upsert({
      where: { empId: emp.empId },
      update: {
        name: emp.name,
        mobileNumber: tenDigit,
        designation: emp.designation || 'Field Officer',
        district: emp.district || 'Betul',
        territory: emp.territory || 'General Zone',
        dailyVisitTarget: Number(emp.dailyVisitTarget) || 10,
        isActive: true,
      },
      create: {
        id: emp.id || `emp-${Date.now()}`,
        empId: emp.empId,
        name: emp.name,
        mobileNumber: tenDigit,
        designation: emp.designation || 'Field Officer',
        district: emp.district || 'Betul',
        territory: emp.territory || 'General Zone',
        dailyVisitTarget: Number(emp.dailyVisitTarget) || 10,
        isActive: true,
      },
    });
  }

  console.log('✅ SEEDED ALL REAL FIELD OFFICERS INTO SUPABASE SUCCESSFULLY!');
}

main()
  .catch((err) => {
    console.error('Seeding Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
