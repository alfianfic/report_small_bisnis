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

function generateCSV() {
  const rows = ['nama,posisi,gaji,tanggal_penggajian'];
  const startDate = new Date(2025, 0, 1);
  const endDate = new Date(2026, 0, 1);
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0) {
      const dateStr = currentDate.toISOString().split('T')[0];
      for (const k of KARYAWAN) {
        rows.push(`${k.nama},${k.posisi},${k.gaji},${dateStr}`);
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const csvPath = path.join(process.cwd(), 'prisma', 'penggajian_data.csv');
  fs.writeFileSync(csvPath, rows.join('\n'));
  console.log(`✅ CSV generated: ${csvPath}`);
  console.log(`📊 Total rows: ${rows.length - 1}`);
}

generateCSV();