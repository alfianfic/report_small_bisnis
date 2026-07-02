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
  console.log('📥 Importing CSV...');

  const csvPath = path.join(process.cwd(), 'prisma', 'penggajian_data.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const rows = lines.slice(1);

  console.log(`📊 Found ${rows.length} rows`);

  // Hapus data lama pakai Prisma
  await prisma.penggajian.deleteMany();
  console.log('🗑️ Data lama dihapus');

  const batchSize = 500;
  let batch: any[] = [];
  let totalInserted = 0;

  for (const row of rows) {
    const cols = row.split(',');
    if (cols.length >= 4) {
      batch.push({
        nama: cols[0].trim(),
        posisi: cols[1].trim(),
        gaji: parseInt(cols[2].trim()),
        tanggal_penggajian: new Date(cols[3].trim()), // ← PAKAI TANDA UNDERSCORE
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

  // Sisa batch
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
    orderBy: { tanggal_penggajian: 'asc' }, // ← PAKAI TANDA UNDERSCORE
  });
  console.log('\n📋 Preview:');
  preview.forEach(p => {
    console.log(`   ${p.nama} | ${p.posisi} | Rp${p.gaji.toLocaleString()} | ${p.tanggal_penggajian.toISOString().split('T')[0]}`); // ← PAKAI TANDA UNDERSCORE
  });

  await prisma.$disconnect();
}

importCSV().catch(console.error);