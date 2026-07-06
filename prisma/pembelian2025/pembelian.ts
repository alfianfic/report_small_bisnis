// prisma/import-pembelian.ts

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

const CSV_FILES = [
  '1januari2025.csv',
  '2februari2025.csv',
  '3maret2025.csv',
  '4april2025.csv',
  '5mei2025.csv',
  '6juni2025.csv',
  '7juli2025.csv',
  '8agustus2025.csv',
  '9september2025.csv',
  '10oktober2025.csv',
  '11november2025.csv',
  '12desember2025.csv',
];

async function importPembelian() {
  console.log('📥 Importing pembelian from CSV files...');

  await prisma.pembelian.deleteMany();
  console.log('🗑️ Data pembelian lama dihapus');

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const csvFile of CSV_FILES) {
    const csvPath = path.join(process.cwd(), 'prisma', 'pembelian2025', csvFile);
    
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️ File tidak ditemukan: ${csvFile}`);
      continue;
    }

    console.log(`\n📄 Processing: ${csvFile}`);

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const rows = lines.slice(1);

    console.log(`📊 Found ${rows.length} rows`);

    for (const row of rows) {
      const cols = row.split(',');
      if (cols.length < 7) {
        totalSkipped++;
        continue;
      }

      const tanggal = cols[0].trim();
      const kategori = cols[1].trim();
      const nama = cols[2].trim();
      const detail = cols[3].trim() || null;
      const qty = parseFloat(cols[4].trim()) || 0;
      const harga = parseInt(cols[5].trim()) || 0;
      const total = parseInt(cols[6].trim()) || 0;

      if (!tanggal || !nama) {
        totalSkipped++;
        continue;
      }

      const tanggalObj = new Date(tanggal);
      tanggalObj.setHours(tanggalObj.getHours() + 7);

      await prisma.pembelian.create({
        data: {
          tanggal: tanggalObj,
          kategori,
          nama,
          detail,
          qty,
          harga,
          total,
        },
      });

      totalInserted++;
    }
  }

  console.log('\n✅ Import selesai!');
  console.log(`📊 Total rows inserted: ${totalInserted}`);
  console.log(`📊 Total skipped: ${totalSkipped}`);

  // Summary per kategori
  const summary = await prisma.$queryRaw`
    SELECT 
      kategori,
      COUNT(*) as total_rows,
      SUM(total) as total_biaya
    FROM "Pembelian"
    GROUP BY kategori
    ORDER BY kategori
  `;
  console.log('\n📊 Summary per kategori:');
  console.table(summary);

  await prisma.$disconnect();
}

importPembelian().catch(console.error);