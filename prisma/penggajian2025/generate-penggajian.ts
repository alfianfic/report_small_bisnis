// prisma/generate-csv.ts

import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const KARYAWAN = [
  { nama: 'Lis', posisi: 'Kitchen', gaji: 100000 },
  { nama: 'Suyati', posisi: 'Kitchen', gaji: 100000 },
  { nama: 'Sum', posisi: 'Kitchen', gaji: 100000 },
  { nama: 'Wiwik', posisi: 'Seller', gaji: 50000 },
  { nama: 'Aziz', posisi: 'Seller', gaji: 50000 },
];

// ✅ DAFTAR TANGGAL LIBUR
const LIBUR: string[] = [];

// 1 Maret - 15 Maret 2025
for (let d = 1; d <= 15; d++) {
  LIBUR.push(`2025-03-${String(d).padStart(2, '0')}`);
}

// 19 April - 22 April 2025
for (let d = 19; d <= 22; d++) {
  LIBUR.push(`2025-04-${String(d).padStart(2, '0')}`);
}

// 30 April - 3 Mei 2025
for (let d = 30; d <= 30; d++) {
  LIBUR.push(`2025-04-${String(d).padStart(2, '0')}`);
}
for (let d = 1; d <= 3; d++) {
  LIBUR.push(`2025-05-${String(d).padStart(2, '0')}`);
}

// 19 Oktober - 22 Oktober 2025
for (let d = 19; d <= 22; d++) {
  LIBUR.push(`2025-10-${String(d).padStart(2, '0')}`);
}

console.log(`📅 Total hari libur: ${LIBUR.length} hari`);

function isLibur(dateStr: string): boolean {
  return LIBUR.includes(dateStr);
}

function generateCSV() {
  const rows = ['nama,posisi,gaji,tanggal_penggajian'];
  const startDate = new Date(2025, 0, 1);
  const endDate = new Date(2026, 0, 1);
  let currentDate = new Date(startDate);
  let totalHariKerja = 0;

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    if (currentDate.getDay() !== 0 && !isLibur(dateStr)) {
      for (const k of KARYAWAN) {
        rows.push(`${k.nama},${k.posisi},${k.gaji},${dateStr}`);
      }
      totalHariKerja++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const csvPath = path.join(process.cwd(), 'prisma', 'penggajian_data.csv');
  fs.writeFileSync(csvPath, rows.join('\n'));
  
  console.log(`✅ CSV generated: ${csvPath}`);
  console.log(`📊 Total rows: ${rows.length - 1}`);
  console.log(`📊 Total hari kerja: ${totalHariKerja} hari`);
  console.log(`📊 Total karyawan: ${KARYAWAN.length} orang`);
  console.log(`📊 Total records: ${totalHariKerja * KARYAWAN.length}`);
}

generateCSV();