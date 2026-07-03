// prisma/import-penjualan.ts

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

// ✅ DAFTAR SEMUA FILE CSV
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

async function importPenjualan() {
  console.log('📥 Importing penjualan from CSV files...');

  // Ambil semua produk untuk mapping nama -> id
  const produkList = await prisma.produk.findMany();
  const produkMap: Record<string, string> = {};
  for (const p of produkList) {
    produkMap[p.nama] = p.id;
  }
  console.log(`📦 Produk tersedia: ${Object.keys(produkMap).join(', ')}`);

  // Hapus data lama (jika ada)
  await prisma.penjualan.deleteMany();
  console.log('🗑️ Data penjualan lama dihapus');

  let totalInserted = 0;
  let totalQty = 0;
  let totalProfit = 0;
  let totalSkipped = 0;

  for (const csvFile of CSV_FILES) {
    const csvPath = path.join(process.cwd(), 'prisma', 'penjualan2025', csvFile);
    
    if (!fs.existsSync(csvPath)) {
      console.log(`⚠️ File tidak ditemukan: ${csvFile}, skip`);
      continue;
    }

    console.log(`\n📄 Processing: ${csvFile}`);

    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(','); // header: tanggal,produk,qty,harga_jual,hpp,profit
    const rows = lines.slice(1);

    console.log(`📊 Found ${rows.length} rows in ${csvFile}`);

    let fileInserted = 0;
    let fileSkipped = 0;

    for (const row of rows) {
      const cols = row.split(',');
      
      // ✅ CEK JUMLAH KOLOM (harus 6)
      if (cols.length < 6) {
        console.warn(`⚠️ Row skip: kolom kurang (${cols.length}): ${row}`);
        fileSkipped++;
        continue;
      }

      const tanggal = cols[0].trim();
      const produkNama = cols[1].trim();
      const qty = parseFloat(cols[2].trim());
      const hargaJual = parseInt(cols[3].trim());
      const hpp = parseInt(cols[4].trim());
      const profit = parseInt(cols[5].trim());

      // ✅ VALIDASI
      if (!tanggal) {
        console.warn(`⚠️ Row skip: tanggal kosong`);
        fileSkipped++;
        continue;
      }

      if (!produkNama) {
        console.warn(`⚠️ Row skip: produk kosong`);
        fileSkipped++;
        continue;
      }

      if (isNaN(qty) || qty <= 0) {
        console.warn(`⚠️ Row skip: qty invalid (${qty})`);
        fileSkipped++;
        continue;
      }

      if (isNaN(hargaJual) || hargaJual <= 0) {
        console.warn(`⚠️ Row skip: hargaJual invalid (${hargaJual})`);
        fileSkipped++;
        continue;
      }

      if (isNaN(hpp) || hpp <= 0) {
        console.warn(`⚠️ Row skip: hpp invalid (${hpp})`);
        fileSkipped++;
        continue;
      }

      const produkId = produkMap[produkNama];
      if (!produkId) {
        console.warn(`⚠️ Produk "${produkNama}" tidak ditemukan, skip`);
        fileSkipped++;
        continue;
      }

      // ✅ SIMPAN TANPA PERHITUNGAN (langsung dari CSV)
      const tanggalObj = new Date(tanggal);
      tanggalObj.setHours(tanggalObj.getHours() + 7);

      await prisma.penjualan.create({
        data: {
          tanggal: tanggalObj,
          produkId: produkId,
          qty: qty,
          hargaJual: hargaJual,
          hpp: hpp,
          profit: profit, // ✅ langsung dari CSV
        },
      });

      fileInserted++;
      totalInserted++;
      totalQty += qty;
      totalProfit += profit;
    }

    console.log(`✅ ${csvFile}: ${fileInserted} rows inserted, ${fileSkipped} skipped`);
    totalSkipped += fileSkipped;
  }

  console.log('\n✅ Import selesai!');
  console.log(`📊 Total rows: ${totalInserted}`);
  console.log(`📊 Total qty: ${totalQty}`);
  console.log(`📊 Total profit: Rp${totalProfit.toLocaleString()}`);
  console.log(`📊 Total skipped: ${totalSkipped}`);

  // ✅ CEK PER BULAN
  const bulanan = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', tanggal) as bulan,
      SUM(qty) as total_qty,
      SUM(profit) as total_profit
    FROM "Penjualan"
    GROUP BY DATE_TRUNC('month', tanggal)
    ORDER BY bulan
  `;
  console.log('\n📊 Summary per bulan:');
  console.table(bulanan);

  await prisma.$disconnect();
}

importPenjualan().catch(console.error);