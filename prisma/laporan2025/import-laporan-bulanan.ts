// prisma/laporan2025/import-laporan-bulanan.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Total Overhead per tahun = 136.706.772
const TOTAL_OVERHEAD_TAHUNAN = 136706771;
const OVERHEAD_PER_BULAN = Math.floor(TOTAL_OVERHEAD_TAHUNAN / 12); // 11.392.231
const SISA_OVERHEAD = TOTAL_OVERHEAD_TAHUNAN - (OVERHEAD_PER_BULAN * 12); // Sisa akan ditambahkan ke Desember

console.log(`📊 Total Overhead Tahunan: Rp${TOTAL_OVERHEAD_TAHUNAN.toLocaleString()}`);
console.log(`📊 Overhead per bulan (11 bulan pertama): Rp${OVERHEAD_PER_BULAN.toLocaleString()}`);
console.log(`📊 Sisa overhead untuk Desember: Rp${SISA_OVERHEAD.toLocaleString()}`);

// ✅ HARI KERJA PER BULAN (TANPA LIBUR MINGGU & NASIONAL)
const HARI_KERJA_PER_BULAN: Record<string, number> = {
  'Januari 2025': 31,
  'Februari 2025': 28,
  'Maret 2025': 15,
  'April 2025': 23,
  'Mei 2025': 31,
  'Juni 2025': 30,
  'Juli 2025': 31,
  'Agustus 2025': 31,
  'September 2025': 30,
  'Oktober 2025': 27,
  'November 2025': 30,
  'Desember 2025': 31,
};

// ✅ GAJI PER BULAN = HARI KERJA × 400.000
const GAJI_PER_BULAN_DETAIL: Record<string, number> = {};
for (const [bulan, hari] of Object.entries(HARI_KERJA_PER_BULAN)) {
  GAJI_PER_BULAN_DETAIL[bulan] = hari * 400000;
}

const TOTAL_GAJI_TAHUNAN = Object.values(GAJI_PER_BULAN_DETAIL).reduce((a, b) => a + b, 0);

console.log(`📊 Total Gaji Tahunan: Rp${TOTAL_GAJI_TAHUNAN.toLocaleString()}`);
console.log('\n📊 Detail Gaji per Bulan:');
for (const [bulan, gaji] of Object.entries(GAJI_PER_BULAN_DETAIL)) {
  console.log(`   ${bulan}: Rp${gaji.toLocaleString()}`);
}

function getBulanDate(bulanStr: string): Date {
  const months: Record<string, number> = {
    'Januari': 0, 'Februari': 1, 'Maret': 2, 'April': 3,
    'Mei': 4, 'Juni': 5, 'Juli': 6, 'Agustus': 7,
    'September': 8, 'Oktober': 9, 'November': 10, 'Desember': 11
  };
  
  const [namaBulan, tahun] = bulanStr.split(' ');
  const date = new Date(parseInt(tahun), months[namaBulan], 1);
  date.setHours(date.getHours() + 7);
  return date;
}

// ✅ DATA PER BULAN (AGGREGATED)
const laporanDataRaw = [
  // Januari 2025
  { 
    bulanStr: 'Januari 2025', 
    qtyProduksi: 8090 + 760 + 760, 
    costPerPortion: ((89890190.48 + 12448192 + 10773076) / (8090 + 760 + 760)),
    jumlahCost: 89890190 + 12448192 + 10773076,
    labaKotor: 129440000 + 17480000 + 17480000
  },
  // Februari 2025
  { 
    bulanStr: 'Februari 2025', 
    qtyProduksi: 6400 + 560 + 560,
    costPerPortion: ((71112140.8 + 9172352 + 7938056) / (6400 + 560 + 560)),
    jumlahCost: 71112140 + 9172352 + 7938056,
    labaKotor: 102400000 + 12880000 + 12880000
  },
  // Maret 2025
  { 
    bulanStr: 'Maret 2025', 
    qtyProduksi: 2950 + 300 + 280,
    costPerPortion: ((32778252.4 + 4913760 + 3969028) / (2950 + 300 + 280)),
    jumlahCost: 32778252 + 4913760 + 3969028,
    labaKotor: 47200000 + 6900000 + 6440000
  },
  // April 2025
  { 
    bulanStr: 'April 2025', 
    qtyProduksi: 6432 + 525 + 522,
    costPerPortion: ((71467701.504 + 8599080 + 7399402.2) / (6432 + 525 + 522)),
    jumlahCost: 71467701 + 8599080 + 7399402,
    labaKotor: 102912000 + 12075000 + 12006000
  },
  // Mei 2025
  { 
    bulanStr: 'Mei 2025', 
    qtyProduksi: 6620 + 572 + 526,
    costPerPortion: ((73556620.64 + 9368902.4 + 7456102.6) / (6620 + 572 + 526)),
    jumlahCost: 73556620 + 9368902 + 7456102,
    labaKotor: 105920000 + 13156000 + 12098000
  },
  // Juni 2025
  { 
    bulanStr: 'Juni 2025', 
    qtyProduksi: 7246 + 610 + 606,
    costPerPortion: ((80512276.912 + 9991312 + 85901106) / (7246 + 610 + 606)),
    jumlahCost: 80512276 + 9991312 + 8590110,
    labaKotor: 115936000 + 14030000 + 13938000
  },
  // Juli 2025
  { 
    bulanStr: 'Juli 2025', 
    qtyProduksi: 7860 + 740 + 720,
    costPerPortion: ((87334597.92 + 12120608 + 10206072) / (7860 + 740 + 720)),
    jumlahCost: 87334597 + 12120608 + 10206072,
    labaKotor: 125760000 + 17020000 + 16560000
  },
  // Agustus 2025
  { 
    bulanStr: 'Agustus 2025', 
    qtyProduksi: 6489 + 464 + 456,
    costPerPortion: ((72101044.008 + 7599948.8 + 6463845.6) / (6489 + 464 + 456)),
    jumlahCost: 72101044 + 7599948 + 6463845,
    labaKotor: 103824000 + 10672000 + 10488000
  },
  // September 2025
  { 
    bulanStr: 'September 2025', 
    qtyProduksi: 5700 + 380 + 380,
    costPerPortion: ((63334250.4 + 6224096 + 5386538) / (5700 + 380 + 380)),
    jumlahCost: 63334250 + 6224096 + 5386538,
    labaKotor: 91200000 + 8740000 + 8740000
  },
  // Oktober 2025
  { 
    bulanStr: 'Oktober 2025', 
    qtyProduksi: 8570 + 748 + 740,
    costPerPortion: ((95223601.04 + 12251641.6 + 10489574) / (8570 + 748 + 740)),
    jumlahCost: 95223601 + 12251641 + 10489574,
    labaKotor: 137120000 + 17204000 + 17020000
  },
  // November 2025
  { 
    bulanStr: 'November 2025', 
    qtyProduksi: 5950 + 420 + 428,
    costPerPortion: ((66112068.4 + 6879264 + 6066942.8) / (5950 + 420 + 428)),
    jumlahCost: 66112068 + 6879264 + 6066942,
    labaKotor: 95200000 + 9660000 + 9844000
  },
  // Desember 2025
  { 
    bulanStr: 'Desember 2025', 
    qtyProduksi: 7960 + 724 + 724,
    costPerPortion: ((88445725.12 + 11858540.8 + 10262772.4) / (7960 + 724 + 724)),
    jumlahCost: 88445725 + 11858540 + 10262772,
    labaKotor: 127360000 + 16652000 + 16652000
  },
];

async function importLaporan() {
  console.log('\n📥 Importing laporan bulanan (1 bulan = 1 row)...');
  console.log(`📊 Overhead per bulan (11 bulan pertama): Rp${OVERHEAD_PER_BULAN.toLocaleString()}`);
  console.log(`📊 Overhead Desember (dengan sisa): Rp${(OVERHEAD_PER_BULAN + SISA_OVERHEAD).toLocaleString()}`);
  console.log(`📊 Total Gaji Tahunan: Rp${TOTAL_GAJI_TAHUNAN.toLocaleString()}`);
  
  await prisma.laporanBulanan.deleteMany();
  console.log('🗑️ Data lama dihapus');

  const processedData = laporanDataRaw.map((item, index) => {
    const bulanDate = getBulanDate(item.bulanStr);
    const gajiBulan = GAJI_PER_BULAN_DETAIL[item.bulanStr] || 0;
    
    // ✅ Tambahkan sisa overhead ke Desember (index terakhir = 11)
    const overheadBulan = (index === laporanDataRaw.length - 1) 
      ? OVERHEAD_PER_BULAN + SISA_OVERHEAD 
      : OVERHEAD_PER_BULAN;
    
    const totalCost = item.jumlahCost + overheadBulan + gajiBulan;
    const profit = item.labaKotor - totalCost;
    
    return {
      bulan: bulanDate,
      qtyProduksi: item.qtyProduksi,
      costPerPortion: item.costPerPortion,
      jumlahCost: item.jumlahCost,
      overhead: overheadBulan,
      gaji: gajiBulan,
      labaKotor: item.labaKotor,
      profit: profit,
    };
  });

  console.log(`\n📊 Found ${processedData.length} records`);

  // Verifikasi total overhead
  const totalOverheadTerhitung = processedData.reduce((sum, item) => sum + item.overhead, 0);
  console.log(`📊 Total Overhead Terhitung: Rp${totalOverheadTerhitung.toLocaleString()}`);
  console.log(`📊 Total Overhead Seharusnya: Rp${TOTAL_OVERHEAD_TAHUNAN.toLocaleString()}`);
  console.log(`📊 Selisih: Rp${(totalOverheadTerhitung - TOTAL_OVERHEAD_TAHUNAN).toLocaleString()}`);

  const batchSize = 50;
  let batch: any[] = [];
  let totalInserted = 0;

  for (const item of processedData) {
    batch.push(item);

    if (batch.length >= batchSize) {
      await prisma.laporanBulanan.createMany({ data: batch });
      totalInserted += batch.length;
      batch = [];
      console.log(`✅ Inserted ${totalInserted}/${processedData.length}`);
    }
  }

  if (batch.length > 0) {
    await prisma.laporanBulanan.createMany({ data: batch });
    totalInserted += batch.length;
  }

  console.log(`✅ Import selesai! Total: ${totalInserted} records`);

  // Preview
  const preview = await prisma.laporanBulanan.findMany({
    take: 12,
    orderBy: { bulan: 'asc' },
  });
  console.log('\n📋 Preview:');
  preview.forEach(p => {
    const bulanStr = p.bulan.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    console.log(`   ${bulanStr} | Qty:${p.qtyProduksi.toLocaleString()} | Overhead:${p.overhead.toLocaleString()} | Gaji:${p.gaji.toLocaleString()} | Profit:${p.profit.toLocaleString()}`);
  });

  // Summary total overhead
  const summary = await prisma.$queryRaw`
    SELECT 
      SUM(overhead) as total_overhead,
      SUM(gaji) as total_gaji,
      SUM(profit) as total_profit
    FROM "LaporanBulanan"
  `;
  console.log('\n📊 Summary Total:');
  console.table(summary);

  await prisma.$disconnect();
}

importLaporan().catch(console.error);