// prisma/seed-penggajian.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const KARYAWAN = [
  { nama: 'Lis', posisi: 'Kitchen', gaji: 100000 },
  { nama: 'Suyati', posisi: 'Kitchen', gaji: 100000 },
  { nama: 'Sum', posisi: 'Kitchen', gaji: 100000 },
  { nama: 'Wiwik', posisi: 'Seller', gaji: 50000 },
  { nama: 'Aziz', posisi: 'Seller', gaji: 50000 },
];

async function main() {
  console.log('🌱 Seeding Penggajian...');

  // Hapus data lama
  await prisma.penggajian.deleteMany();
  console.log('🗑️ Data lama dihapus');

  // Generate data
  const startDate = new Date(2025, 0, 1);
  const endDate = new Date(2026, 0, 1);
  let currentDate = new Date(startDate);
  const allData = [];

  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0) {
      for (const k of KARYAWAN) {
        allData.push({
          nama: k.nama,
          posisi: k.posisi,
          gaji: k.gaji,
          tanggalPenggajian: new Date(currentDate),
        });
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`📊 Generated ${allData.length} records`);

  // Batch insert
  const batchSize = 500;
  for (let i = 0; i < allData.length; i += batchSize) {
    const batch = allData.slice(i, i + batchSize);
    await prisma.penggajian.createMany({
      data: batch,
    });
    console.log(`✅ Inserted ${Math.min(i + batchSize, allData.length)}/${allData.length}`);
  }

  console.log('✅ Seed Penggajian selesai!');

  // Preview
  const preview = await prisma.penggajian.findMany({
    take: 5,
    orderBy: { tanggalPenggajian: 'asc' },
  });
  console.log('\n📋 Preview:');
  preview.forEach(p => {
    console.log(`   ${p.nama} | ${p.posisi} | Rp${p.gaji.toLocaleString()} | ${p.tanggalPenggajian.toISOString().split('T')[0]}`);
  });

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('❌ Error seeding Penggajian:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });