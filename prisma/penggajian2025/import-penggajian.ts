// prisma/import-penggajian.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function importCSV() {
  console.log('📥 Importing CSV penggajian...');

  const csvPath = path.join(process.cwd(), 'prisma', 'penggajian_data.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('❌ File CSV tidak ditemukan!');
    console.log('▶️ Jalankan: npx ts-node prisma/generate-csv.ts');
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const rows = lines.slice(1);

  console.log(`📊 Found ${rows.length} rows in CSV`);

  // Hapus data lama
  await prisma.penggajian.deleteMany();
  console.log('🗑️ Data lama dihapus');

  const batchSize = 500;
  let batch: any[] = [];
  let totalInserted = 0;

  for (const row of rows) {
    const cols = row.split(',');
    if (cols.length >= 4) {
      const nama = cols[0].trim();
      const posisi = cols[1].trim();
      const gaji = parseInt(cols[2].trim());
      
      // ✅ TANGGAL: parse dari CSV dan set ke UTC+7 (WIB)
      const tanggalStr = cols[3].trim();
      const [year, month, day] = tanggalStr.split('-').map(Number);
      
      // Buat tanggal dengan waktu 00:00:00 WIB (UTC+7)
      // Ini akan tersimpan di database sebagai UTC
      const tanggal = new Date(Date.UTC(year, month - 1, day, 17, 0, 0));
      // 17:00 UTC = 00:00 WIB (UTC+7)

      batch.push({
        nama,
        posisi,
        gaji,
        tanggal_penggajian: tanggal,
      });

      if (batch.length >= batchSize) {
        await prisma.penggajian.createMany({
          data: batch,
        });
        totalInserted += batch.length;
        batch = [];
        console.log(`✅ Inserted ${totalInserted}/${rows.length}`);
      }
    }
  }

  if (batch.length > 0) {
    await prisma.penggajian.createMany({
      data: batch,
    });
    totalInserted += batch.length;
  }

  console.log(`✅ Import selesai! Total: ${totalInserted} records`);

  // Preview
  const preview = await prisma.penggajian.findMany({
    take: 10,
    orderBy: { tanggal_penggajian: 'asc' },
  });
  console.log('\n📋 Preview:');
  preview.forEach(p => {
    console.log(`   ${p.nama} | ${p.posisi} | Rp${p.gaji.toLocaleString()} | ${p.tanggal_penggajian.toISOString().split('T')[0]}`);
  });

  // Summary per bulan
  const summary = await prisma.$queryRaw`
    SELECT 
      TO_CHAR(tanggal_penggajian, 'Month YYYY') as bulan,
      COUNT(*) as total_hari,
      SUM(gaji) as total_gaji
    FROM "Penggajian"
    GROUP BY TO_CHAR(tanggal_penggajian, 'Month YYYY')
    ORDER BY MIN(tanggal_penggajian)
  `;
  console.log('\n📊 Summary per bulan:');
  console.table(summary);

  const totalGaji = await prisma.penggajian.aggregate({
    _sum: { gaji: true },
  });
  console.log(`\n📊 Total Gaji Tahunan: Rp${(totalGaji._sum.gaji || 0).toLocaleString()}`);

  await prisma.$disconnect();
}

importCSV().catch(console.error);